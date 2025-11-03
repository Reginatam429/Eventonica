import pool from '../db.js';
import { z } from 'zod';

const bodySchema = z.object({
    name: z.string().min(1),
    priceCents: z.coerce.number().int().min(0),
    quantity: z.coerce.number().int().min(1),
    salesStart: z.coerce.date().optional(),
    salesEnd: z.coerce.date().optional()
});

export async function createTicketType(req, res) {
    const { eventId } = req.params;
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });

    const u = req.user;
    const { rows: [ev] } = await pool.query(`SELECT organizer_id, end_at FROM events WHERE id=$1`, [eventId]);
    if (!ev) return res.status(404).json({ error: 'event_not_found' });
    const admin = (u.roles||[]).includes('admin');
    if (u.id !== ev.organizer_id && !admin) return res.status(403).json({ error: 'forbidden' });

    const salesStart = parsed.data.salesStart ?? new Date();
    const salesEnd = parsed.data.salesEnd ?? ev.end_at;
    if (salesEnd < salesStart) return res.status(400).json({ error: 'salesEnd_before_salesStart' });
    if (salesEnd > ev.end_at) return res.status(400).json({ error: 'salesEnd_after_event_end' });

    const { rows: [tt] } = await pool.query(
        `INSERT INTO ticket_types (event_id,name,price_cents,quantity,sales_start,sales_end)
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *`,
        [eventId, parsed.data.name, parsed.data.priceCents, parsed.data.quantity, salesStart, salesEnd]
    );
    res.status(201).json({ ticketType: tt });
}

export async function listTicketTypes(req, res) {
    const { eventId } = req.params;
    const { rows } = await pool.query(
        `SELECT * FROM ticket_types WHERE event_id=$1 ORDER BY price_cents ASC, name ASC`,
        [eventId]
    );
    res.json({ items: rows });
}

export async function updateTicketType(req, res) {
    const { id } = req.params;

    const { rows: [tt] } = await pool.query(`SELECT event_id FROM ticket_types WHERE id=$1`, [id]);
    if (!tt) return res.status(404).json({ error: 'not_found' });
    const { rows: [ev] } = await pool.query(`SELECT organizer_id FROM events WHERE id=$1`, [tt.event_id]);

    const u = req.user;
    const admin = (u.roles||[]).includes('admin');
    if (u.id !== ev.organizer_id && !admin) return res.status(403).json({ error: 'forbidden' });

    const map = { name:'name', priceCents:'price_cents', quantity:'quantity', salesStart:'sales_start', salesEnd:'sales_end' };
    const set=[], values=[]; let i=1;
    for (const k in req.body) if (map[k]) { set.push(`${map[k]}=$${i++}`); values.push(req.body[k]); }
    if (!set.length) return res.json({ ok:true });

    values.push(id);
    const { rows: [updated] } = await pool.query(
        `UPDATE ticket_types SET ${set.join(', ')}, updated_at=NOW() WHERE id=$${i} RETURNING *`,
        values
    );
    res.json({ ticketType: updated });
}

export async function deleteTicketType(req, res) {
    const { id } = req.params;
    await pool.query(`DELETE FROM ticket_types WHERE id=$1`, [id]);
    res.status(204).send();
}
