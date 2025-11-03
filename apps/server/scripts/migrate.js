import 'dotenv/config';
import fs from 'fs';
import pg from 'pg';

const sqlBody = fs.readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const client = await pool.connect();
try {
    await client.query('BEGIN');

    await client.query(`
        DO $$
        DECLARE r RECORD;
        BEGIN
        FOR r IN
            SELECT n.nspname, c.relname, t.tgname
            FROM pg_trigger t
            JOIN pg_class   c ON c.oid = t.tgrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE NOT t.tgisinternal
            AND n.nspname = 'public'
            AND t.tgname LIKE 'trg\\_%\\_updated\\_at' ESCAPE '\\'
        LOOP
            EXECUTE format('DROP TRIGGER %I ON %I.%I', r.tgname, r.nspname, r.relname);
        END LOOP;
        END$$;
    `);

    await client.query(`
        CREATE OR REPLACE FUNCTION set_updated_at()
        RETURNS trigger AS $$
        BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `);

    await client.query(sqlBody);

    await client.query(`
        DO $$
        BEGIN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='users' AND column_name='email'
        ) THEN
            CREATE UNIQUE INDEX IF NOT EXISTS users_email_uindex ON public.users(email);
        END IF;
        END$$;
    `);

    await client.query('COMMIT');
    console.log('✅ migration done');
    process.exit(0);
} catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ migration error', e);
    process.exit(1);
} finally {
    client.release();
    await pool.end();


console.log('Reading schema.sql from:', new URL('../schema.sql', import.meta.url).toString());
console.log('schema.sql length:', sqlBody?.length);
}


