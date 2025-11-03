import db from '../db.js';
import crypto from 'crypto';

export async function checkout(req, res, next) {
    const userId = req.user.id;
    const { eventId } = req.params;

    const rawItems = req.body?.items;
    if (!Array.isArray(rawItems) || !rawItems.length) {
        return res.status(400).json({ error: 'bad_items' });
    }

    // Normalize items: accept qty or quantity, coerce to int
    const items = rawItems.map(it => ({
        ticketTypeId: it.ticketTypeId,
        qty: Number(it.qty ?? it.quantity ?? 0),
    }));

    // Basic validation
    if (items.some(it => !it.ticketTypeId || !Number.isInteger(it.qty) || it.qty < 1)) {
        return res.status(400).json({ error: 'bad_items' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 1) Event must exist AND be published
        const { rows: [ev] } = await client.query(
        'SELECT id, published FROM public.events WHERE id = $1',
        [eventId],
        );
        if (!ev || !ev.published) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'event_not_found_or_unpublished' });
        }

        // 2) Fetch ticket types for this event
        const ids = items.map(i => i.ticketTypeId);
        const { rows: tts } = await client.query(
        `SELECT id, event_id, name, price_cents, quantity
        FROM public.ticket_types
        WHERE event_id = $1 AND id = ANY($2::uuid[])`,
        [eventId, ids],
        );
        if (tts.length !== items.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'invalid_ticket_types' });
        }

        // 3) Check capacity & compute total
        let total = 0;
        for (const it of items) {
        const tt = tts.find(t => t.id === it.ticketTypeId);
        if (!tt || it.qty < 1) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'bad_quantity' });
        }
        if (tt.quantity < it.qty) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'sold_out', ticketTypeId: tt.id });
        }
        total += tt.price_cents * it.qty;
        }

        // 4) Create order (status must match CHECK constraint)
        const { rows: [order] } = await client.query(
        `INSERT INTO public.orders (user_id, event_id, total_cents, status)
        VALUES ($1, $2, $3, 'confirmed')
        RETURNING id, user_id, event_id, total_cents, status, created_at`,
        [userId, eventId, total],
        );

        // 5) Decrement quantities + create tickets
        const tickets = [];
        for (const it of items) {
        await client.query(
            `UPDATE public.ticket_types
            SET quantity = quantity - $2, updated_at = NOW()
            WHERE id = $1`,
            [it.ticketTypeId, it.qty],
        );

        for (let i = 0; i < it.qty; i++) {
            const qr = `ord:${order.id}:tt:${it.ticketTypeId}:i:${i}:${crypto.randomBytes(6).toString('hex')}`;
            const { rows: [t] } = await client.query(
            `INSERT INTO public.tickets (order_id, event_id, user_id, ticket_type_id, qr_code)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, qr_code, created_at`,
            [order.id, eventId, userId, it.ticketTypeId, qr],
            );
            tickets.push(t);
        }
        }

        await client.query('COMMIT');
        return res.status(201).json({ order, tickets });
    } catch (e) {
        await client.query('ROLLBACK');
        return next(e);
    } finally {
        client.release();
    }
}

export async function listMyOrders(req, res, next) {
    try {
        const { rows } = await db.query(
        `SELECT id, event_id, total_cents, status, created_at
        FROM public.orders WHERE user_id = $1 ORDER BY created_at DESC`,
        [req.user.id],
        );
        res.json({ orders: rows });
    } catch (e) {
        next(e);
    }
}

export async function listMyTickets(req, res, next) {
    try {
        const { rows } = await db.query(
        `SELECT t.id, t.event_id, t.ticket_type_id, t.qr_code, t.checked_in_at, t.created_at,
                e.title AS event_title, tt.name AS ticket_type_name
        FROM public.tickets t
        JOIN public.events e ON e.id = t.event_id
        JOIN public.ticket_types tt ON tt.id = t.ticket_type_id
        WHERE t.user_id = $1
        ORDER BY t.created_at DESC`,
        [req.user.id],
        );
        res.json({ tickets: rows });
    } catch (e) {
        next(e);
    }
}

export async function listOrdersForEvent(req, res, next) {
    const { eventId } = req.params;
    const userId = req.user.id;
    const roles = req.user.roles || [];

    try {
      // make sure event exists
        const { rows: [ev] } = await db.query(
            'SELECT id, organizer_id, title FROM public.events WHERE id = $1',
            [eventId],
        );
        if (!ev) return res.status(404).json({ error: 'event_not_found' });
    
        // only organizer or admin can see
        if (ev.organizer_id !== userId && !roles.includes('admin')) {
            return res.status(403).json({ error: 'forbidden' });
        }
    
        const { rows } = await db.query(`
            SELECT 
            o.id,
            o.total_cents,
            o.status,
            o.created_at,
            u.id   AS user_id,
            u.name AS user_name,
            u.email
            FROM public.orders o
            JOIN public.users u ON u.id = o.user_id
            WHERE o.event_id = $1
            ORDER BY o.created_at DESC
        `, [eventId]);
    
        return res.json({
            event: { id: ev.id, title: ev.title },
            orders: rows,
        });
    } catch (e) {
        next(e);
    }
}

export async function listAttendeesForEvent(req, res, next) {
    const { eventId } = req.params;
    const userId = req.user.id;
    const roles = req.user.roles || [];

    try {
        const { rows: [ev] } = await db.query(
            'SELECT id, organizer_id, title FROM public.events WHERE id = $1',
            [eventId],
        );
        if (!ev) return res.status(404).json({ error: 'event_not_found' });
    
        if (ev.organizer_id !== userId && !roles.includes('admin')) {
            return res.status(403).json({ error: 'forbidden' });
        }
    
        const { rows } = await db.query(`
            SELECT
            u.id,
            u.name,
            u.email,
            COUNT(t.id)::int                    AS tickets_total,
            COUNT(t.checked_in_at)::int         AS tickets_checked_in
            FROM public.tickets t
            JOIN public.users u ON u.id = t.user_id
            WHERE t.event_id = $1
            GROUP BY u.id, u.name, u.email
            ORDER BY u.name
        `, [eventId]);
    
        return res.json({
            event: { id: ev.id, title: ev.title },
            attendees: rows,
        });
    } catch (e) {
        next(e);
    }
}