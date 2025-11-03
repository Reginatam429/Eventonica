// src/events/eventVendors.routes.js
import { Router } from 'express';
import requireAuth from '../auth/requireAuth.js';
import {
    addVendorToEvent,
    listVendorsForEvent,
} from './eventVendors.controller.js';

const r = Router();

// Assign vendor to event (organizer/admin only)
r.post('/events/:eventId/vendors', requireAuth, addVendorToEvent);

// List vendors for an event (public)
r.get('/events/:eventId/vendors', listVendorsForEvent);

export default r;
