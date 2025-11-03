import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import authRoutes from './auth/auth.routes.js';
import eventRoutes from './events/events.routes.js';
import ticketTypeRoutes from './ticketTypes/ticketTypes.routes.js';
import usersRoutes from './users/users.routes.js';
import adminUsersRoutes from './admin/admin.users.routes.js';

const app = express();

app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api', ticketTypeRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin/users', adminUsersRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'not_found' }));

// error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    // map common PG errors
    if (err?.code === '23505') return res.status(409).json({ error: 'conflict', detail: err.detail });
    res.status(500).json({ error: 'internal_error' });
});

export default app;
