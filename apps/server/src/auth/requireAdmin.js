export default function requireAdmin(req, res, next) {
    if (!req.user || !Array.isArray(req.user.roles) || !req.user.roles.includes('admin')) {
        return res.status(403).json({ error: 'forbidden' });
    }
    next();
}