import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'smartsaver_dev_secret';

/**
 * Generate JWT token for a user.
 */
export function generateToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' },
    );
}

/**
 * Require valid JWT. Sets req.user = { id, email }.
 */
export function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid token' });
    }
    try {
        const payload = jwt.verify(header.slice(7), JWT_SECRET);
        req.user = { id: payload.id, email: payload.email };
        next();
    } catch {
        return res.status(401).json({ error: 'Token expired or invalid' });
    }
}

/**
 * Optional auth — sets req.user if token present, but doesn't block.
 */
export function optionalAuth(req, _res, next) {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
        try {
            const payload = jwt.verify(header.slice(7), JWT_SECRET);
            req.user = { id: payload.id, email: payload.email };
        } catch { /* ignore */ }
    }
    next();
}
