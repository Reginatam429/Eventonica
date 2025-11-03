import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));

// to check in the correct database(temporarily)
console.log('API DB =>', process.env.DATABASE_URL);

// 404
app.use((req, res) => res.status(404).json({ error: 'not_found' }));

// Centralized error handler so nothing crashes the process
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    if (res.headersSent) return next(err);
    res.status(500).json({ error: 'internal_error' });
});

