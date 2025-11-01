import type { Request, Response, NextFunction } from 'express';

export function requireRoles(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user as { roles?: string[] };
        if (!user?.roles || !roles.some(r => user.roles!.includes(r))) {
        return res.status(403).json({ error: 'forbidden' });
        }
        next();
    };
}

