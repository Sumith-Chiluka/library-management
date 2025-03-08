const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const router = express.Router();

// 📌 User Registration (Signup)
router.post('/register', (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if email already exists
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.length > 0) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        // Hash the password
        bcrypt.genSalt(10, (err, salt) => {
            if (err) return res.status(500).json({ error: err.message });

            bcrypt.hash(password, salt, (err, hashedPassword) => {
                if (err) return res.status(500).json({ error: err.message });

                // Insert new user
                db.query(
                    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                    [name, email, hashedPassword, role || 'member'],
                    (err, result) => {
                        if (err) return res.status(500).json({ error: err.message });

                        res.status(201).json({ message: 'User registered successfully' });
                    }
                );
            });
        });
    });
});

// 📌 User Login (Authentication)
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const user = result[0];

        // Compare passwords
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return res.status(500).json({ error: err.message });

            if (!isMatch) {
                return res.status(400).json({ error: 'Invalid credentials' });
            }

            // Generate JWT token
            const token = jwt.sign(
                { user_id: user.user_id, role: user.role },
                'secretkey',
                { expiresIn: '1h' }
            );

            res.json({ message: 'Login successful', token });
        });
    });
});

module.exports = router;
