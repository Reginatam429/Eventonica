import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcrypt';
import pool from '../src/db.js';

const client = await pool.connect();

try {
    await client.query('BEGIN');

    // Organizer user
    const orgHash = await bcrypt.hash('password123', 10);
    const { rows: [organizer] } = await client.query(
        `INSERT INTO users (name, email, password_hash, roles)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
        RETURNING id, email, roles`,
        ['Organizer One', 'org@test.com', orgHash, ['attendee', 'organizer']]
    );

    // Admin user
    const adminHash = await bcrypt.hash('admin123', 10);
    const { rows: [admin] } = await client.query(
        `INSERT INTO users (name, email, password_hash, roles)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
        RETURNING id, email, roles`,
        ['Admin User', 'admin@test.com', adminHash, ['attendee', 'admin']]
    );

    // Sample event by organizer
    const { rows: [event] } = await client.query(
        `INSERT INTO events
        (organizer_id, title, description, type, venue, address, start_at, end_at, capacity, published, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (title) DO NOTHING
        RETURNING id, title`,
        [
        organizer.id,
        'My First Event',
        'Hello Eventonica',
        'Meetup',
        'Community Center',
        '123 Main St, Seattle, WA',
        '2026-02-01T02:00:00Z',
        '2026-02-01T05:00:00Z',
        100,
        false,
        'draft'
        ]
    );

    await client.query('COMMIT');
    console.log('✅ Seed complete:', {
        organizer: organizer.email,
        admin: admin.email,
        event: event?.title || 'Event skipped (already exists)',
    });
    process.exit(0);
} catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Seed error:', e);
    process.exit(1);
} finally {
    client.release();
}
