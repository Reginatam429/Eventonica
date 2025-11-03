import pool from '../db.js';
import { z } from 'zod';

// small helpers
const isAdmin = (req) => (req.user?.roles || []).includes('admin');

export async function listUsers(req, res, next) {
    try {
        if (!isAdmin(req)) return res.status(403).json({ error: 'forbidden' });
        const { rows } = await pool.query(
        'SELECT id, name, email, roles FROM users ORDER BY created_at DESC'
        );
        res.json({ items: rows });
    } catch (e) { next(e); }
}

export async function getUserById(req, res, next) {
    try {
        const { id } = req.params;
        const self = req.user?.id === id;
        if (!self && !isAdmin(req)) return res.status(403).json({ error: 'forbidden' });

        const { rows } = await pool.query(
        'SELECT id, name, email, roles FROM users WHERE id = $1',
        [id]
        );
        if (!rows.length) return res.status(404).json({ error: 'not_found' });
        res.json({ user: rows[0] });
    } catch (e) { next(e); }
}

const rolesSchema = z.object({
    roles: z.array(z.enum(['attendee','organizer','vendor','admin'])).nonempty()
});

// Admin can set roles (including admin)
export async function adminSetRoles(req, res, next) {
    try {
        if (!isAdmin(req)) return res.status(403).json({ error: 'forbidden' });
        const { id } = req.params;
        const parsed = rolesSchema.safeParse(req.body);
        if (!parsed.success) {
        return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        }
        const { rows } = await pool.query(
        'UPDATE users SET roles = $2 WHERE id = $1 RETURNING id, name, email, roles',
        [id, parsed.data.roles]
        );
        if (!rows.length) return res.status(404).json({ error: 'not_found' });
        res.json({ user: rows[0] });
    } catch (e) { next(e); }
}
