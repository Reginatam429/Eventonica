import jwt from 'jsonwebtoken';
const SECRET = process.env.JWT_SECRET;

export const signJwt = (payload, opts = {}) =>
    jwt.sign(payload, SECRET, { expiresIn: opts.expiresIn || '7d' });

export const verifyJwt = (token) => jwt.verify(token, SECRET);
