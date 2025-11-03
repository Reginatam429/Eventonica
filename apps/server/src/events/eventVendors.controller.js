import pool from '../db.js';

function hasRole(user, role) {
    return Array.isArray(user.roles) && user.roles.includes(role);
}

// POST /api/events/:eventId/vendors
// Body: { "userId": "<vendor-user-id>" }
export async function addVendorToEvent(req, res) {
    try {
        const { eventId } = req.params;
        const { userId } = req.body;
        const authUser = req.user;

        if (!userId) {
        return res.status(400).json({ error: 'userId_required' });
        }

        // 1) Ensure event exists and get organizer
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

        // 2) Ensure vendor user exists
        const { rows: userRows } = await pool.query(
        'SELECT id, email, name FROM public.users WHERE id = $1',
        [userId],
        );
        const vendor = userRows[0];
        if (!vendor) {
        return res.status(404).json({ error: 'vendor_user_not_found' });
        }

        // 3) Create assignment (idempotent)
        const { rows: assignmentRows } = await pool.query(
        `INSERT INTO public.event_assignments (event_id, user_id, role)
        VALUES ($1, $2, 'vendor')
        ON CONFLICT (event_id, user_id, role) DO NOTHING
        RETURNING id, event_id, user_id, role, created_at`,
        [eventId, userId],
        );

        const alreadyAssigned = assignmentRows.length === 0;

        // 4) Drop a notification for the vendor (push+email stub)
        const payload = {
        kind: 'vendor_assignment',
        message: `You have been assigned as a vendor for event "${event.title}".`,
        eventId: event.id,
        eventTitle: event.title,
        };

        await pool.query(
        `INSERT INTO public.notifications (user_id, event_id, type, payload)
        VALUES ($1, $2, 'assignment', $3::jsonb)`,
        [vendor.id, event.id, JSON.stringify(payload)],
        );

        return res.status(201).json({
        assignment: assignmentRows[0] || null,
        alreadyAssigned,
        vendor: {
            id: vendor.id,
            name: vendor.name,
            email: vendor.email,
        },
        });
    } catch (err) {
        console.error('addVendorToEvent error', err);
        return res.status(500).json({ error: 'internal_error' });
    }
}

// GET /api/events/:eventId/vendors
export async function listVendorsForEvent(req, res) {
    try {
        const { eventId } = req.params;

        const { rows } = await pool.query(
        `SELECT u.id, u.name, u.email
        FROM public.event_assignments ea
        JOIN public.users u ON u.id = ea.user_id
        WHERE ea.event_id = $1 AND ea.role = 'vendor'
        ORDER BY u.name`,
        [eventId],
        );

        return res.json({ vendors: rows });
    } catch (err) {
        console.error('listVendorsForEvent error', err);
        return res.status(500).json({ error: 'internal_error' });
    }
}
