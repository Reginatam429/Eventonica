import db from '../db.js';
import bcrypt from 'bcrypt';

/** Allowed roles for safety */
const ROLES = ['attendee', 'organizer', 'vendor', 'admin'];
/** Normalize and validate email */
const normalizeEmail = (e) => String(e || '').trim().toLowerCase();

// GET /api/admin/users
export async function adminListUsers(req, res) {
    try {
        const {
        search = '',
        role = '',
        page = 1,
        pageSize = 20,
        sort = 'created_at',
        dir = 'desc',
        } = req.query;

        const sortCols = new Set(['created_at', 'email', 'name']);
        const sortCol = sortCols.has(String(sort)) ? String(sort) : 'created_at';
        const sortDir = String(dir).toLowerCase() === 'asc' ? 'asc' : 'desc';

        const p = Number(page) > 0 ? Number(page) : 1;
        const ps = Number(pageSize) > 0 && Number(pageSize) <= 100 ? Number(pageSize) : 20;
        const offset = (p - 1) * ps;

        const wheres = [];
        const values = [];
        let i = 1;

        if (search && search.trim()) {
        wheres.push(`(LOWER(name) LIKE $${i} OR LOWER(email) LIKE $${i})`);
        values.push(`%${search.trim().toLowerCase()}%`);
        i++;
        }

        if (role && role.trim()) {
        wheres.push(`$${i} = ANY(roles)`);
        values.push(role.trim());
        i++;
        }

        const whereSql = wheres.length ? `WHERE ${wheres.join(' AND ')}` : '';

        const sql = `
        SELECT id, name, email, roles, created_at
        FROM public.users
        ${whereSql}
        ORDER BY ${sortCol} ${sortDir}
        LIMIT $${i} OFFSET $${i + 1}`;
        values.push(ps, offset);

        const rows = (await db.query(sql, values)).rows;

        const countSql = `SELECT COUNT(*)::int AS count FROM public.users ${whereSql}`;
        const total = (await db.query(countSql, values.slice(0, values.length - 2))).rows[0].count;

        res.json({ page: p, pageSize: ps, total, users: rows });
    } catch (err) {
        console.error('adminListUsers error:', err);
        res.status(500).json({ error: 'internal_error' });
    }
}

// GET /api/admin/users/:id
export async function adminGetUser(req, res) {
    try {
        const { id } = req.params;
        const { rows } = await db.query(
        `SELECT id, name, email, roles, created_at FROM public.users WHERE id = $1`,
        [id]
        );
        if (!rows.length) return res.status(404).json({ error: 'not_found' });
        res.json({ user: rows[0] });
    } catch (err) {
        console.error('adminGetUser error:', err);
        res.status(500).json({ error: 'internal_error' });
    }
}

// POST /api/admin/users
export async function adminCreateUser(req, res, next) {
    try {
        const name = (req.body?.name || '').trim();
        const email = normalizeEmail(req.body?.email);
        const password = req.body?.password || '';
        const roles = Array.isArray(req.body?.roles)
        ? req.body.roles.filter((r) => ROLES.includes(r))
        : ['attendee'];

        if (!name || !email || password.length < 6) {
        return res.status(400).json({ error: 'invalid_body' });
        }

        // Check duplicates
        const dup = await db.query(
        `SELECT 1 FROM public.users WHERE LOWER(email) = $1 LIMIT 1`,
        [email]
        );
        if (dup.rowCount) return res.status(409).json({ error: 'email_exists' });

        const hash = await bcrypt.hash(password, 10);

        const { rows: [u] } = await db.query(
        `INSERT INTO public.users (id, name, email, password_hash, roles)
        VALUES (gen_random_uuid(), $1, $2, $3, $4)
        RETURNING id, name, email, roles, created_at`,
        [name, email, hash, roles.length ? roles : ['attendee']]
        );

        res.status(201).json({ user: u });
    } catch (e) {
        next(e);
    }
}

// PATCH /api/admin/users/:id
export async function adminUpdateUser(req, res) {
    try {
        const { id } = req.params;
        const { name, email, roles } = req.body;

        const fields = [];
        const values = [];
        let i = 1;

        if (typeof name === 'string') { fields.push(`name = $${i++}`); values.push(name.trim()); }
        if (typeof email === 'string') { fields.push(`email = LOWER($${i++})`); values.push(email); }
        if (Array.isArray(roles)) { fields.push(`roles = $${i++}`); values.push(roles.filter(r => ROLES.includes(r))); }

        if (!fields.length) return res.status(400).json({ error: 'no_updates' });

        const sql = `
        UPDATE public.users
        SET ${fields.join(', ')}, updated_at = NOW()
        WHERE id = $${i}
        RETURNING id, name, email, roles, created_at`;
        values.push(id);

        const { rows } = await db.query(sql, values);
        if (!rows.length) return res.status(404).json({ error: 'not_found' });
        res.json({ user: rows[0] });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'email_exists' });
        console.error('adminUpdateUser error:', err);
        res.status(500).json({ error: 'internal_error' });
    }
}

// DELETE /api/admin/users/:id
export async function adminDeleteUser(req, res) {
    try {
        const { id } = req.params;
        const { rowCount } = await db.query(`DELETE FROM public.users WHERE id = $1`, [id]);
        if (!rowCount) return res.status(404).json({ error: 'not_found' });
        res.json({ ok: true });
    } catch (err) {
        console.error('adminDeleteUser error:', err);
        res.status(500).json({ error: 'internal_error' });
    }
}

// POST /api/admin/users/:id/promote-admin
export async function promoteAdmin(req, res) {
    try {
        const { id } = req.params;
        const { rows } = await db.query(
        `UPDATE public.users
            SET roles = (SELECT ARRAY(SELECT DISTINCT unnest(roles || ARRAY['admin']::text[]))),
                updated_at = NOW()
        WHERE id = $1
        RETURNING id, name, email, roles, created_at`,
        [id]
        );
        if (!rows.length) return res.status(404).json({ error: 'not_found' });
        res.json({ user: rows[0] });
    } catch (err) {
        console.error('promoteAdmin error:', err);
        res.status(500).json({ error: 'internal_error' });
    }
}

// POST /api/admin/users/:id/demote-admin
export async function demoteAdmin(req, res) {
    try {
        const { id } = req.params;
        const { rows } = await db.query(
        `UPDATE public.users
            SET roles = ARRAY(SELECT r FROM unnest(roles) r WHERE r <> 'admin'),
                updated_at = NOW()
        WHERE id = $1
        RETURNING id, name, email, roles, created_at`,
        [id]
        );
        if (!rows.length) return res.status(404).json({ error: 'not_found' });
        res.json({ user: rows[0] });
    } catch (err) {
        console.error('demoteAdmin error:', err);
        res.status(500).json({ error: 'internal_error' });
    }
}
