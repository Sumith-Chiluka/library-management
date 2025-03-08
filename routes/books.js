const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateUser, authenticateAdmin } = require('../middleware/authMiddleware');

// 📌 Get all books (Only logged-in users)
router.get('/books', authenticateUser, (req, res) => {
    db.query('SELECT * FROM books', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 📌 Get a book by ID (Only logged-in users)
router.get('/books/:id', authenticateUser, (req, res) => {
    const bookId = req.params.id;
    db.query('SELECT * FROM books WHERE book_id = ?', [bookId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length === 0) return res.status(404).json({ message: 'Book not found' });
        res.json(result[0]);
    });
});

// 📌 Add a new book (Only Admins)
router.post('/books', authenticateUser, authenticateAdmin, (req, res) => {
    const { title, author, genre, publication_year, available_copies } = req.body;
    const sql = 'INSERT INTO books (title, author, genre, publication_year, available_copies) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [title, author, genre, publication_year, available_copies], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Book added successfully', bookId: result.insertId });
    });
});

// 📌 Update a book (Only Admins)
router.put('/books/:id', authenticateUser, authenticateAdmin, (req, res) => {
    const bookId = req.params.id;
    const { title, author, genre, publication_year, available_copies } = req.body;
    const sql = 'UPDATE books SET title=?, author=?, genre=?, publication_year=?, available_copies=? WHERE book_id=?';
    db.query(sql, [title, author, genre, publication_year, available_copies, bookId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Book not found' });
        res.json({ message: 'Book updated successfully' });
    });
});

// 📌 Delete a book (Only Admins)
router.delete('/books/:id', authenticateUser, authenticateAdmin, (req, res) => {
    const bookId = req.params.id;
    db.query('DELETE FROM books WHERE book_id = ?', [bookId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Book not found' });
        res.json({ message: 'Book deleted successfully' });
    });
});

module.exports = router;
