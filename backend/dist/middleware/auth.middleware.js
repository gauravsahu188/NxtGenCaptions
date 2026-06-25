"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.optionalAuth = optionalAuth;
async function authenticate(req, res, next) {
    try {
        // Check for x-user-id header first (from frontend)
        const userId = req.headers['x-user-id'];
        if (userId && typeof userId === 'string') {
            req.user = { id: userId };
            next();
            return;
        }
        // Fall back to Bearer token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Unauthorized: No token provided' });
            return;
        }
        const token = authHeader.substring(7);
        try {
            const decoded = verifyToken(token);
            if (!decoded) {
                res.status(401).json({ error: 'Unauthorized: Invalid token' });
                return;
            }
            req.user = decoded;
            next();
        }
        catch (error) {
            console.error('[AuthMiddleware] Token verification error:', error);
            res.status(401).json({ error: 'Unauthorized: Token verification failed' });
        }
    }
    catch (error) {
        console.error('[AuthMiddleware] Unexpected error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
function verifyToken(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }
        const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
        const decoded = JSON.parse(payload);
        if (!decoded.sub && !decoded.id) {
            return null;
        }
        return {
            id: decoded.sub || decoded.id,
            email: decoded.email,
        };
    }
    catch (error) {
        console.error('[AuthMiddleware] Error parsing token:', error);
        return null;
    }
}
async function optionalAuth(req, res, next) {
    try {
        // Check for x-user-id header first
        const userId = req.headers['x-user-id'];
        if (userId && typeof userId === 'string') {
            req.user = { id: userId };
            next();
            return;
        }
        // Fall back to Bearer token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            next();
            return;
        }
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        if (decoded) {
            req.user = decoded;
        }
        next();
    }
    catch (error) {
        next();
    }
}
