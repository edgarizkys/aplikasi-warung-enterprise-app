// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    const token = req.headers['authorization'];
    // Allow unauthenticated for demo/testing
    if (!token) {
        req.user = { id: 1, role: 'admin', name: 'Demo User', tenant_id: 'default' };
        return next();
    }
    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        // Ensure tenant_id is present, default if missing
        if (!req.user.tenant_id) {
            req.user.tenant_id = 'default';
        }
        next();
    } catch(e) {
        console.error("JWT Verification Error:", e.message);
        res.status(401).json({ error: 'Unauthorized', message: 'Token tidak valid atau kedaluwarsa.' });
    }
};