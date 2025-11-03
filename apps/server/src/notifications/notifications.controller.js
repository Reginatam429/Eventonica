import pool from '../db.js';

// GET /api/me/notifications
export async function listMyNotifications(req, res) {
    try {
        const userId = req.user.id;

        const { rows } = await pool.query(
        `SELECT id, event_id, type, payload, read_at, created_at
        FROM public.notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 100`,
        [userId],
        );

        return res.json({ notifications: rows });
    } catch (err) {
        console.error('listMyNotifications error', err);
        return res.status(500).json({ error: 'internal_error' });
    }
}

// POST /api/notifications/:id/read
export async function markNotificationRead(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { rows } = await pool.query(
        `UPDATE public.notifications
        SET read_at = NOW()
        WHERE id = $1 AND user_id = $2 AND read_at IS NULL
        RETURNING id, event_id, type, payload, read_at, created_at`,
        [id, userId],
        );

        const notification = rows[0];
        if (!notification) {
        return res.status(404).json({ error: 'not_found' });
        }

        return res.json({ notification });
    } catch (err) {
        console.error('markNotificationRead error', err);
        return res.status(500).json({ error: 'internal_error' });
    }
}
