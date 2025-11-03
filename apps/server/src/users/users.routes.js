import { Router } from 'express';
import requireAuth from '../auth/requireAuth.js';
import { listUsers, getUserById, adminSetRoles } from './users.controller.js';

const r = Router();

// GET /api/users  -> admin only
r.get('/', requireAuth, listUsers);

// GET /api/users/:id -> self or admin
r.get('/:id', requireAuth, getUserById);

// PATCH /api/users/:id/roles -> admin can set any roles (incl. admin)
r.patch('/:id/roles', requireAuth, adminSetRoles);

export default r;
