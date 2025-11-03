import { Router } from 'express';
import requireAuth from '../auth/requireAuth.js';
import { checkInByQr } from './checkin.controller.js';

const r = Router();

// POST /api/check-in
r.post('/check-in', requireAuth, checkInByQr);

export default r;