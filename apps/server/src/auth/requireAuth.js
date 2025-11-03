import { verifyJwt } from './jwt.js';

export default function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'unauthorized' });
    try {
        req.user = verifyJwt(token);
        next();
    } catch {
        res.status(401).json({ error: 'invalid_token' });
    }
}
