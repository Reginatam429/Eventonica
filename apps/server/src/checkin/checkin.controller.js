import db from '../db.js';

export async function checkInByQr(req, res, next) {
    const { qrCode } = req.body;
    const userId = req.user.id;
    const roles = req.user.roles || [];

    if (!qrCode) {
        return res.status(400).json({ error: 'missing_qr_code' });
    }

    try {
        // Find ticket + event
        const { rows: [ticket] } = await db.query(`
        SELECT 
            t.id,
            t.event_id,
            t.user_id,
            t.qr_code,
            t.checked_in_at,
            e.title       AS event_title,
            e.organizer_id
        FROM public.tickets t
        JOIN public.events e ON e.id = t.event_id
        WHERE t.qr_code = $1
        `, [qrCode]);

        if (!ticket) {
        return res.status(404).json({ error: 'ticket_not_found' });
        }

        // Only organizer/admin can check-in
        if (ticket.organizer_id !== userId && !roles.includes('admin')) {
        return res.status(403).json({ error: 'forbidden' });
        }

        if (ticket.checked_in_at) {
        return res.status(409).json({
            error: 'already_checked_in',
            checked_in_at: ticket.checked_in_at,
        });
        }

        const { rows: [updated] } = await db.query(`
        UPDATE public.tickets
        SET checked_in_at = NOW()
        WHERE id = $1
        RETURNING id, event_id, user_id, qr_code, checked_in_at
        `, [ticket.id]);

        return res.json({
        ticket: updated,
        event: {
            id: ticket.event_id,
            title: ticket.event_title,
        },
        });
    } catch (e) {
        next(e);
    }
}