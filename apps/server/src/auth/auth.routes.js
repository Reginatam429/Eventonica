import { Router } from 'express';
import { register, login, updateMyRoles } from './auth.controller.js';
import requireAuth from './requireAuth.js';

const r = Router();

r.post('/register', register);
r.post('/login',    login);

r.patch('/me/roles', requireAuth, updateMyRoles);

export default r;
