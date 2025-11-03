import pool from '../db.js';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { signJwt } from './jwt.js';

const registerSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
});

export async function register(req, res) {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    const { name, email, password } = parsed.data;

    const hash = await bcrypt.hash(password, 10);
    try {
        const { rows: [u] } = await pool.query(
        `INSERT INTO users (name,email,password_hash) VALUES ($1,$2,$3)
        RETURNING id,name,email,roles`,
        [name, email, hash]
        );
        const token = signJwt({ id: u.id, roles: u.roles });
        res.status(201).json({ user: u, token });
    } catch (e) {
        if (e.code === '23505') return res.status(409).json({ error: 'email_exists' });
        throw e;
    }
}

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

export async function login(req, res) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    const { email, password } = parsed.data;

    const { rows: [u] } = await pool.query(`SELECT * FROM users WHERE email=$1`, [email]);
    if (!u) return res.status(401).json({ error: 'invalid_credentials' });

    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

    const token = signJwt({ id: u.id, roles: u.roles });
    res.json({ user: { id: u.id, name: u.name, email: u.email, roles: u.roles }, token });
}

const roleSet = new Set(['organizer', 'vendor']); // self-assignable

const rolesSchema = z.object({
    add: z.array(z.enum(['organizer', 'vendor'])).optional().default([]),
    remove: z.array(z.enum(['organizer', 'vendor'])).optional().default([]),
});

export async function updateMyRoles(req, res, next) {
    try {
        // req.user is set by requireAuth (Bearer token)
        const me = req.user;
        if (!me?.id) return res.status(401).json({ error: 'unauthorized' });

        const parsed = rolesSchema.safeParse(req.body);
        if (!parsed.success) {
        return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        }

        const { rows } = await pool.query('SELECT id, name, email, roles FROM users WHERE id = $1', [me.id]);
        if (!rows.length) return res.status(401).json({ error: 'unauthorized' });

        const current = Array.isArray(rows[0].roles) ? rows[0].roles : [];
        const toRemove = new Set(parsed.data.remove);
        const toAdd = new Set(parsed.data.add);

        // Never allow self-adding/removing 'admin'
        const nextRoles = Array.from(
        new Set([
            ...current.filter(r => r !== 'admin' && !toRemove.has(r)),
            ...Array.from(toAdd).filter(r => roleSet.has(r)),
        ])
        );
        if (current.includes('admin') && !nextRoles.includes('admin')) nextRoles.push('admin');

        const { rows: [u] } = await pool.query(
        'UPDATE users SET roles = $2 WHERE id = $1 RETURNING id, name, email, roles',
        [me.id, nextRoles]
        );

        // Issue a fresh token with updated roles
        const token = signJwt({ id: u.id, roles: u.roles });
        return res.json({ user: u, token });
    } catch (err) {
        next(err);
    }
}