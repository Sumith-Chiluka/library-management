const jwt = require('jsonwebtoken');

// 📌 Middleware to check if user is logged in
const authenticateUser = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    try {
        const decoded = jwt.verify(token.replace("Bearer ", ""), 'secretkey');
        req.user = decoded; // Store user details in request object
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

// 📌 Middleware to check if user is an Admin
const authenticateAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    next();
};

module.exports = { authenticateUser, authenticateAdmin };
