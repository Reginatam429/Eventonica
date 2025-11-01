import type { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';

export function requireEventOwnerOrAdmin() {
    return async (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user as { id: string; roles?: string[] };
        if (user?.roles?.includes('admin')) return next();

        const { eventId } = req.params as { eventId: string };
        const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { organizerId: true },
        });
        if (!event) return res.status(404).json({ error: 'event_not_found' });
        if (event.organizerId !== user.id) return res.status(403).json({ error: 'forbidden' });
        next();
    };
}
