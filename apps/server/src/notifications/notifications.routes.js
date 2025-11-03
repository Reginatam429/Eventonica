import { Router } from 'express';
import requireAuth from '../auth/requireAuth.js';
import {
    listMyNotifications,
    markNotificationRead,
} from './notifications.controller.js';

const r = Router();

// In-app notification inbox ("push")
r.get('/me/notifications', requireAuth, listMyNotifications);

// Mark one notification as read
r.post('/notifications/:id/read', requireAuth, markNotificationRead);

export default r;
