import { Router } from 'express';
import requireAuth from '../auth/requireAuth.js';
import {
    createAnnouncement,
    listAnnouncements,
} from './updates.controller.js';

const r = Router();

// Organizer/Admin creates an announcement
r.post('/events/:eventId/announcements', requireAuth, createAnnouncement);

// Anyone can read announcements for an event
r.get('/events/:eventId/announcements', listAnnouncements);

export default r;
