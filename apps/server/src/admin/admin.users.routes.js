import { Router } from 'express';
import requireAuth from '../auth/requireAuth.js';
import requireAdmin from '../auth/requireAdmin.js';
import {
    adminListUsers,
    adminGetUser,
    adminCreateUser,
    adminUpdateUser,
    adminDeleteUser,
    promoteAdmin,
    demoteAdmin,
} from './admin.users.controller.js';

const r = Router();

r.use(requireAuth, requireAdmin);

r.get('/', adminListUsers);
r.get('/:id', adminGetUser);
r.post('/', adminCreateUser);
r.patch('/:id', adminUpdateUser);
r.delete('/:id', adminDeleteUser);

// convenience helpers
r.post('/:id/promote-admin', promoteAdmin);
r.post('/:id/demote-admin', demoteAdmin);

export default r;
