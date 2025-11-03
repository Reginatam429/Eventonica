import pool from '../db.js';
import { sendEmail } from '../utils/email.js';

function hasRole(user, role) {
    return Array.isArray(user.roles) && user.roles.includes(role);
}

// POST /api/events/:eventId/announcements
// Body: { "message": "text of update" }
export async function createAnnouncement(req, res) {
    try {
        const { eventId } = req.params;
        const { message } = req.body;
        const authUser = req.user;

        if (!message || typeof message !== 'string' || message.trim().length < 3) {
        return res.status(400).json({ error: 'message_too_short' });
        }
        const msg = message.trim();

        // 1) Get event + ensure organizer/admin
        const { rows: eventRows } = await pool.query(
        'SELECT id, organizer_id, title FROM public.events WHERE id = $1',
        [eventId],
        );
        const event = eventRows[0];
        if (!event) {
        return res.status(404).json({ error: 'event_not_found' });
        }

        const isAdmin = hasRole(authUser, 'admin');
        const isOrganizer = authUser.id === event.organizer_id;
        if (!isAdmin && !isOrganizer) {
        return res.status(403).json({ error: 'forbidden' });
        }

        // 2) Insert into event_updates (feed for the event)
        const { rows: updateRows } = await pool.query(
        `INSERT INTO public.event_updates (event_id, message, created_by)
        VALUES ($1, $2, $3)
        RETURNING id, event_id, message, created_by, created_at`,
        [eventId, msg, authUser.id],
        );
        const update = updateRows[0];

        // 3) Build recipients:
        //    - attendees with tickets
        //    - vendors assigned
        //    - organizer
        const { rows: ticketRows } = await pool.query(
        'SELECT DISTINCT user_id FROM public.tickets WHERE event_id = $1 AND user_id IS NOT NULL',
        [eventId],
        );
        const { rows: vendorRows } = await pool.query(
        "SELECT user_id FROM public.event_assignments WHERE event_id = $1 AND role = 'vendor'",
        [eventId],
        );

        const recipients = new Set();
        ticketRows.forEach((r) => r.user_id && recipients.add(r.user_id));
        vendorRows.forEach((r) => r.user_id && recipients.add(r.user_id));
        recipients.add(event.organizer_id);

        const recipientIds = Array.from(recipients);
        let notifiedCount = 0;

        if (recipientIds.length > 0) {
        const payload = {
            kind: 'event_update',
            eventId: event.id,
            eventTitle: event.title,
            updateId: update.id,
            message: update.message,
            createdAt: update.created_at,
            channels: ['push', 'email'],
        };

        // 4) Insert notifications (this is your "push" inbox)
        const { rowCount } = await pool.query(
            `INSERT INTO public.notifications (user_id, event_id, type, payload)
            SELECT unnest($1::uuid[]), $2::uuid, 'update', $3::jsonb`,
            [recipientIds, event.id, JSON.stringify(payload)],
        );
        notifiedCount = rowCount;

        // 5) "Email" + "push" stubs – log to console
        const { rows: users } = await pool.query(
            'SELECT id, email, name FROM public.users WHERE id = ANY($1::uuid[])',
            [recipientIds],
        );

        for (const u of users) {
            const subject = `Update for event: ${event.title}`;
            const body = `Hello ${u.name || ''},\n\n${msg}\n\n— Eventonica Team`;
            try {
                await sendEmail({
                to: u.email,
                subject,
                text: body,
                });
            } catch (err) {
                console.error('Email failed for %s:', u.email, err.message);
            }

            // PUSH stub (still logs)
            console.log('[PUSH] user=%s payload=%j', u.id, payload);
        }
        }

        return res.status(201).json({ update, notifiedCount });
    } catch (err) {
        console.error('createAnnouncement error', err);
        return res.status(500).json({ error: 'internal_error' });
    }
}

// GET /api/events/:eventId/announcements
export async function listAnnouncements(req, res) {
    try {
        const { eventId } = req.params;

        const { rows } = await pool.query(
        `SELECT id, message, created_by, created_at
        FROM public.event_updates
        WHERE event_id = $1
        ORDER BY created_at DESC`,
        [eventId],
        );

        return res.json({ updates: rows });
    } catch (err) {
        console.error('listAnnouncements error', err);
        return res.status(500).json({ error: 'internal_error' });
    }
}
