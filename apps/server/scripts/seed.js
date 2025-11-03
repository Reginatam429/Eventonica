import 'dotenv/config';
import bcrypt from 'bcrypt';
import pool from '../src/db.js';

const client = await pool.connect();

const upsertUser = async ({ name, email, password, roles }) => {
    const norm = email.toLowerCase();
    const hash = await bcrypt.hash(password, 10);

    const { rows } = await client.query(
        'SELECT id FROM public.users WHERE email = $1',
        [norm]
    );

    if (rows.length) {
        const { rows: [u] } = await client.query(
        `UPDATE public.users
            SET name = $2, password_hash = $3, roles = $4, updated_at = NOW()
        WHERE email = $1
        RETURNING id, email, roles`,
        [norm, name, hash, roles]
        );
        return u;
    } else {
        const { rows: [u] } = await client.query(
        `INSERT INTO public.users (name, email, password_hash, roles)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, roles`,
        [name, norm, hash, roles]
        );
        return u;
    }
};

const upsertEventForOrganizer = async (organizerId, data) => {
    const { title } = data;
    const { rows } = await client.query(
        `SELECT id FROM public.events
        WHERE organizer_id = $1 AND title = $2`,
        [organizerId, title]
    );

    if (rows.length) {
        const eventId = rows[0].id;
        const { rows: [e] } = await client.query(
        `UPDATE public.events
            SET description = $3, type = $4, venue = $5, address = $6,
                start_at = $7, end_at = $8, capacity = $9, updated_at = NOW()
        WHERE id = $2
        RETURNING id, title`,
        [
            organizerId,
            eventId,
            data.description,
            data.type,
            data.venue,
            data.address,
            data.start_at,
            data.end_at,
            data.capacity
        ]
        );
        return e;
    } else {
        const { rows: [e] } = await client.query(
        `INSERT INTO public.events
            (organizer_id, title, description, type, venue, address,
            start_at, end_at, capacity, published, status)
        VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, title`,
        [
            organizerId,
            data.title,
            data.description,
            data.type,
            data.venue,
            data.address,
            data.start_at,
            data.end_at,
            data.capacity,
            data.published ?? false,
            data.status ?? 'draft'
        ]
        );
        return e;
    }
};

const upsertTicketType = async (eventId, { name, price_cents, quantity }) => {
    const { rows } = await client.query(
        `SELECT id FROM public.ticket_types
        WHERE event_id = $1 AND name = $2`,
        [eventId, name]
    );

    if (rows.length) {
        const id = rows[0].id;
        const { rows: [tt] } = await client.query(
        `UPDATE public.ticket_types
            SET price_cents = $3, quantity = $4, updated_at = NOW()
        WHERE id = $5
        RETURNING id, name`,
        [eventId, name, price_cents, quantity, id]
        );
        return tt;
    } else {
        const { rows: [tt] } = await client.query(
        `INSERT INTO public.ticket_types
            (event_id, name, price_cents, quantity)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name`,
        [eventId, name, price_cents, quantity]
        );
        return tt;
    }
};

try {
    await client.query('BEGIN');

    // Core users
    const organizer = await upsertUser({
        name: 'Organizer One',
        email: 'org@test.com',
        password: 'password123',
        roles: ['attendee', 'organizer']
    });

    const admin = await upsertUser({
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'admin123',
        roles: ['attendee', 'admin']
    });

    const attendee = await upsertUser({
        name: 'Test Attendee',
        email: 'test2@test.com',
        password: 'password123',
        roles: ['attendee']
    });

    // Sample organizer event
    const evt = await upsertEventForOrganizer(organizer.id, {
        title: 'My First Event',
        description: 'Welcome to Eventonica!',
        type: 'Meetup',
        venue: 'Community Center',
        address: '123 Main St, Seattle, WA',
        start_at: '2026-02-01T02:00:00Z',
        end_at: '2026-02-01T05:00:00Z',
        capacity: 100,
        published: false,
        status: 'draft'
    });

    // Sample ticket type
    await upsertTicketType(evt.id, {
        name: 'General Admission',
        price_cents: 1500,
        quantity: 100
    });

    await client.query('COMMIT');
    console.log('✅ Seed complete:', {
        organizer: organizer.email,
        admin: admin.email,
        attendee: attendee.email,
        event: evt.title
    });
    process.exit(0);
} catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Seed error:', e);
    process.exit(1);
} finally {
    client.release();
}
