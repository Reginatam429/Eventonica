import { Router } from 'express';
import requireAuth from '../auth/requireAuth.js';
import { 
    checkout, 
    listMyOrders, 
    listMyTickets,
    listOrdersForEvent,
    listAttendeesForEvent,
} from './orders.controller.js';

const r = Router();

r.post('/events/:eventId/checkout', requireAuth, checkout);
r.get('/me/orders', requireAuth, listMyOrders);
r.get('/me/tickets', requireAuth, listMyTickets);
r.get('/events/:eventId/orders', requireAuth, listOrdersForEvent);
r.get('/events/:eventId/attendees', requireAuth, listAttendeesForEvent);

export default r;
