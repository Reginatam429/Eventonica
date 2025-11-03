import pool from '../db.js';
import { z } from 'zod';

const eventSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    type: z.string().min(1),
    venue: z.string().min(1),
    address: z.string().min(1),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    capacity: z.coerce.number().int().min(1)
});

// LIST published events (public)
export async function listPublicEvents(req, res, next) {
    try {
        const { rows } = await pool.query(`
            SELECT id, organizer_id, title, description, type, venue, address,
                start_at, end_at, capacity, status, published,
                created_at, updated_at
            FROM public.events
            WHERE published = TRUE
            ORDER BY start_at ASC
            LIMIT 100
        `);
        res.json({ events: rows });
    } catch (err) {
        next(err);
    }
}

export async function createEvent(req, res, next) {
    try {
        const parsed = eventSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    
        const u = req.user;
        if (!u?.roles?.includes('organizer') && !u?.roles?.includes('admin')) {
            return res.status(403).json({ error: 'forbidden' });
        }
    
        const d = parsed.data;
        const { rows: [ev] } = await pool.query(
            `INSERT INTO events (organizer_id,title,description,type,venue,address,start_at,end_at,capacity)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            RETURNING *`,
            [u.id, d.title, d.description, d.type, d.venue, d.address, d.startAt, d.endAt, d.capacity]
        );
        return res.status(201).json({ event: ev });
    } catch (err) {
        return next(err);
    }
}

// PUBLISH event (organizer/admin)
export async function publishEvent(req, res, next) {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ error: 'unauthorized' });
    
        const { id } = req.params;
    
        // 1) fetch event
        const { rows: [cur] } = await pool.query(
            'SELECT id, organizer_id FROM public.events WHERE id = $1',
            [id]
        );
        if (!cur) return res.status(404).json({ error: 'not_found' });
    
        // 2) authorize
        const isOwner = cur.organizer_id === user.id;
        const isAdmin = Array.isArray(user.roles) && user.roles.includes('admin');
        if (!isOwner && !isAdmin) return res.status(403).json({ error: 'forbidden' });
    
        // 3) publish
        const { rows: [ev] } = await pool.query(
            `UPDATE public.events
            SET published = TRUE, status = 'published', updated_at = NOW()
            WHERE id = $1
            RETURNING id, organizer_id, title, description, type, venue, address,
                    start_at, end_at, capacity, status, published,
                    created_at, updated_at`,
            [id]
        );
        return res.json({ event: ev });
    } catch (err) {
        next(err);
    }
}

export async function getEvent(req, res) {
    const { id } = req.params;
    const { rows: [ev] } = await pool.query(`SELECT * FROM events WHERE id=$1`, [id]);
    if (!ev) return res.status(404).json({ error: 'not_found' });

    if (!ev.published) {
        const u = req.user;
        if (!u || (u.id !== ev.organizer_id && !(u.roles||[]).includes('admin')))
        return res.status(403).json({ error: 'forbidden' });
    }
    res.json({ event: ev });
}

export async function updateEvent(req, res) {
    const { id } = req.params;
    const u = req.user;

    const { rows: [own] } = await pool.query(`SELECT organizer_id FROM events WHERE id=$1`, [id]);
    if (!own) return res.status(404).json({ error: 'not_found' });
    const admin = (u.roles||[]).includes('admin');
    if (u.id !== own.organizer_id && !admin) return res.status(403).json({ error: 'forbidden' });

    const map = { title:'title', description:'description', type:'type', venue:'venue', address:'address',
                    startAt:'start_at', endAt:'end_at', capacity:'capacity', published:'published', status:'status' };
    const set=[], vals=[]; let i=1;
    for (const k in req.body) if (map[k]) { set.push(`${map[k]}=$${i++}`); vals.push(req.body[k]); }
    if (!set.length) return res.json({ ok:true });
    vals.push(id);
    const { rows: [updated] } = await pool.query(
        `UPDATE events SET ${set.join(', ')}, updated_at=NOW() WHERE id=$${i} RETURNING *`,
        vals
    );
    res.json({ event: updated });
}

export async function deleteEvent(req, res, next) {
    try {
        const { id } = req.params;
    
        // 1) Make sure it exists + get owner
        const { rows: [own] } = await pool.query(
            'SELECT organizer_id FROM public.events WHERE id=$1',
            [id]
        );
        if (!own) return res.status(404).json({ error: 'not_found' });
    
        // 2) Authorization (organizer or admin)
        const u = req.user;
        const isAdmin = Array.isArray(u?.roles) && u.roles.includes('admin');
        if (!u || (u.id !== own.organizer_id && !isAdmin)) {
            return res.status(403).json({ error: 'forbidden' });
        }
    
        // 3) Delete (transaction; clean dependents first if FK isn’t cascading)
        await pool.query('BEGIN');
        await pool.query('DELETE FROM public.tickets WHERE event_id=$1', [id]).catch(() => {});
        await pool.query('DELETE FROM public.ticket_types WHERE event_id=$1', [id]).catch(() => {});
        const { rows: [deleted] } = await pool.query(
            'DELETE FROM public.events WHERE id=$1 RETURNING id',
            [id]
        );
        await pool.query('COMMIT');
    
        if (!deleted) return res.status(404).json({ error: 'not_found' });
      return res.status(204).send(); // No Content
    } catch (err) {
        try { await pool.query('ROLLBACK'); } catch {}
        return next(err);
    }
}

export async function getEventAnalytics(req, res, next) {
    const { id } = req.params;
    const userId = req.user.id;
    const roles = req.user.roles || [];

    try {
        // 1) Load event & authorize organizer/admin
        const { rows: [ev] } = await pool.query(
            'SELECT id, organizer_id, capacity, title FROM public.events WHERE id = $1',
            [id],
        );
        if (!ev) return res.status(404).json({ error: 'not_found' });

        const isOwner = ev.organizer_id === userId;
        const isAdmin = roles.includes('admin');
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'forbidden' });
        }

        // 2) Basic ticket counts
        const { rows: [tix] } = await pool.query(`
            SELECT
                COUNT(*)::int             AS tickets_total,
                COUNT(checked_in_at)::int AS tickets_checked_in
            FROM public.tickets
            WHERE event_id = $1
        `, [id]);

        // 3) Revenue from confirmed orders
        const { rows: [rev] } = await pool.query(`
            SELECT
                COALESCE(SUM(oi.qty * oi.price_cents), 0)::int AS revenue_cents
            FROM public.order_items oi
            JOIN public.orders o ON o.id = oi.order_id
            WHERE o.event_id = $1
            AND o.status = 'confirmed'
        `, [id]);

        const totalTickets      = tix?.tickets_total || 0;
        const checkedIn         = tix?.tickets_checked_in || 0;
        const remainingCapacity = Math.max(ev.capacity - totalTickets, 0);

        return res.json({
            event: {
                id: ev.id,
                title: ev.title,
            },
            tickets_total: totalTickets,
            tickets_checked_in: checkedIn,
            remaining_capacity: remainingCapacity,
            revenue_cents: rev?.revenue_cents || 0,
        });
    } catch (e) {
        return next(e);
    }
}