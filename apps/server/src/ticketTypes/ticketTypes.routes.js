import { Router } from 'express';
import requireAuth from '../auth/requireAuth.js';
import { createTicketType, listTicketTypes, updateTicketType, deleteTicketType } from './ticketTypes.controller.js';

const r = Router();
r.post('/events/:eventId/ticket-types', requireAuth, createTicketType);
r.get('/events/:eventId/ticket-types', listTicketTypes);
r.patch('/ticket-types/:id', requireAuth, updateTicketType);
r.delete('/ticket-types/:id', requireAuth, deleteTicketType);
export default r;
