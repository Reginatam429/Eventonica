import pool from '../db.js';
import bcrypt from 'bcrypt';
import db from '../db.js';
import { z } from 'zod';
import { signJwt } from './jwt.js';

// only roles users are allowed to self-assign at signup
const SELF_ROLES = ['attendee', 'organizer', 'vendor'];

const registerSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
});

const normalizeEmail = (e) => String(e || '').trim().toLowerCase();

function normalizeSelfRoles(clientRoles) {
    // always at least attendee
    const base = ['attendee'];

    if (!Array.isArray(clientRoles)) {
        return base;
    }

    // allow only organizer/vendor, never admin
    for (const r of clientRoles) {
        const role = String(r).toLowerCase();
        if (role === 'admin') continue; // ignore
        if (SELF_ROLES.includes(role) && !base.includes(role)) {
            base.push(role);
        }
    }

    return base;
} 

export async function register(req, res, next) {
    try {
        const { name, email, password, roles: requestedRoles } = req.body;
    
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'missing_fields' });
        }
    
        const normalizedEmail = normalizeEmail(email);
    
        // ensure email is not already taken
        const existing = await query(
            'SELECT id FROM public.users WHERE email = $1',
            [normalizedEmail]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'email_in_use' });
        }
    
        const passwordHash = await bcrypt.hash(password, 10);
    
        const roles = normalizeSelfRoles(requestedRoles);
    
        const result = await query(
            `INSERT INTO public.users (name, email, password_hash, roles)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, email, roles, created_at`,
            [name, normalizedEmail, passwordHash, roles]
        );
    
        const user = result.rows[0];
        const token = signToken({
            id: user.id,
            roles: user.roles,
        });
    
    return res.status(201).json({ user, token });
    } catch (err) {
        console.error('register error:', err);
        return res.status(500).json({ error: 'internal_error' });
    }
}

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

export async function login(req, res) {
    try {
        const email = normalizeEmail(req.body?.email);
        const password = String(req.body?.password || '');
    
        if (!email || !password) {
            return res.status(400).json({ error: 'invalid_body' });
        }
    
        const { rows } = await db.query(
            `SELECT id, name, email, roles, password_hash
            FROM public.users
            WHERE LOWER(email) = $1
            LIMIT 1`,
            [email]
        );
        if (!rows.length || !rows[0].password_hash) {
            return res.status(401).json({ error: 'invalid_credentials' });
        }
    
        const ok = await bcrypt.compare(password, rows[0].password_hash);
        if (!ok) return res.status(401).json({ error: 'invalid_credentials' });
    
        const token = signJwt({ id: rows[0].id, roles: rows[0].roles || [] });
    
        return res.json({
            user: {
            id: rows[0].id,
            name: rows[0].name,
            email: rows[0].email,
            roles: rows[0].roles || [],
            },
            token,
        });
    } catch (err) {
        console.error('login error:', err);
        return res.status(500).json({ error: 'internal_error' });
    }
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