import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';  // <-- add

const JWT_SECRET = (process.env.JWT_SECRET || 'dev') as string;

export type AuthToken = {
    id: string;
    email: string;
    roles: string[];
};

// Note the parameter type: StringValue | number
export function signJwt(
    payload: AuthToken,
    expiresIn: StringValue | number = '7d' as StringValue
    ): string {
    const options: SignOptions = { expiresIn };
    return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyJwt<T = AuthToken>(token: string): T {
    return jwt.verify(token, JWT_SECRET) as T;
}

export const cookieOpts = {
    httpOnly: true as const,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
};
