import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '../lib/jwt.js';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: 'unauthenticated' });
    try {
        (req as any).user = verifyJwt(token);
        next();
    } catch {
        res.status(401).json({ error: 'invalid_token' });
    }
}
