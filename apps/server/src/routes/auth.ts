import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { hashPassword, verifyPassword } from '../lib/hash.js';
import { signJwt, cookieOpts } from '../lib/jwt.js';
import { normalizeRoles } from '../lib/roles.js';

const router = Router();

/* ---------- Schemas ---------- */
const registerSchema = z.object({
    name: z.string().min(1),
    email: z.email(),
    password: z.string().min(6),
});

const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(6),
});

// Only allow self-enable organizer/vendor (admin is seeded only)
const rolesSchema = z.object({
    add: z.array(z.enum(['organizer', 'vendor'])).default([]),
    remove: z.array(z.enum(['organizer', 'vendor'])).default([]),
});

/* ---------- Helpers ---------- */
function userPublic(u: any) {
    return { id: u.id, name: u.name, email: u.email, roles: normalizeRoles(u.roles) };
}

/* ---------- Routes ---------- */

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'email_in_use' });

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
        data: {
        name,
        email,
        passwordHash,
        roles: ['attendee'] as unknown as Prisma.InputJsonValue, // Json column input
        },
    });

    const rolesArr = normalizeRoles(user.roles);
    const token = signJwt({ id: user.id, email: user.email, roles: rolesArr });
    res.cookie('token', token, cookieOpts);
    return res.status(201).json({ user: userPublic(user) });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'invalid_credentials' });

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

    const rolesArr = normalizeRoles(user.roles);
    const token = signJwt({ id: user.id, email: user.email, roles: rolesArr });
    res.cookie('token', token, cookieOpts);
    return res.json({ user: userPublic(user) });
});

// POST /api/auth/logout
router.post('/logout', async (_req, res) => {
    res.clearCookie('token', { ...cookieOpts, maxAge: 0 });
    res.status(204).end();
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
    const token = (req.cookies?.token as string | undefined) || '';
    if (!token) return res.status(200).json({ user: null });

    try {
        // lightweight decode to get id (avoids throwing on expired token decode)
        const payload = JSON.parse(
        Buffer.from(token.split('.')[1] || '', 'base64').toString('utf8')
        ) as { id?: string };
        if (!payload?.id) return res.status(200).json({ user: null });

        const user = await prisma.user.findUnique({ where: { id: payload.id } });
        if (!user) return res.status(200).json({ user: null });

        return res.json({ user: userPublic(user) });
    } catch {
        return res.status(200).json({ user: null });
    }
});

// PATCH /api/auth/me/roles
router.patch('/me/roles', async (req, res) => {
    const token = req.cookies?.token as string | undefined;
    if (!token) return res.status(401).json({ error: 'unauthenticated' });

    const parsed = rolesSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });

    // very light decode; we just need id
    const payload = JSON.parse(
        Buffer.from(token.split('.')[1] || '', 'base64').toString('utf8')
    ) as { id?: string };

    if (!payload?.id) return res.status(401).json({ error: 'unauthenticated' });

    const me = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!me) return res.status(401).json({ error: 'unauthenticated' });

    const current = normalizeRoles(me.roles);
    const removeSet = new Set(parsed.data.remove);   // only 'organizer' | 'vendor'
    const addSet = new Set(parsed.data.add);

    const next = Array.from(
        new Set([
        ...current.filter((r) => !removeSet.has(r as 'organizer' | 'vendor')),
        ...Array.from(addSet),
        ])
    );

    const updated = await prisma.user.update({
        where: { id: me.id },
        data: { roles: next as unknown as Prisma.InputJsonValue },
    });

    const rolesArr = normalizeRoles(updated.roles);
    const tokenNew = signJwt({ id: updated.id, email: updated.email, roles: rolesArr });
    res.cookie('token', tokenNew, cookieOpts);

    return res.json({ user: userPublic(updated) });
});

export default router;
