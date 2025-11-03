import { Router } from 'express';
import requireAuth from '../auth/requireAuth.js';
import { createEvent, listPublicEvents, getEvent, updateEvent, publishEvent, deleteEvent } from './events.controller.js';

const r = Router();

r.get('/', listPublicEvents);
r.get('/:id', getEvent);
r.post('/', requireAuth, createEvent);
r.patch('/:id', requireAuth, updateEvent);
r.post('/:id/publish', requireAuth, publishEvent);
r.delete('/:id', requireAuth, deleteEvent);
export default r;
