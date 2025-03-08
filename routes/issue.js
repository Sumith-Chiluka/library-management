const express = require('express');
const db = require('../config/db');
const { authenticateUser, authenticateAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// 📌 Issue a book (Members only)
router.post('/', authenticateUser, (req, res) => {
    const userId = req.user.user_id; // Get user ID from token
    const { book_id, due_date } = req.body;

    if (!book_id || !due_date) {
        return res.status(400).json({ error: 'Book ID and Due Date are required' });
    }

    // Check if book is available
    db.query('SELECT available_copies FROM books WHERE book_id = ?', [book_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length === 0) return res.status(404).json({ error: 'Book not found' });

        const availableCopies = result[0].available_copies;

        if (availableCopies < 1) {
            return res.status(400).json({ error: 'No copies available for this book' });
        }

        // Check if user already borrowed 3 books
        db.query('SELECT COUNT(*) AS borrowed_count FROM issued_books WHERE user_id = ? AND returned = FALSE', [userId], (err, countResult) => {
            if (err) return res.status(500).json({ error: err.message });

            if (countResult[0].borrowed_count >= 3) {
                return res.status(400).json({ error: 'You cannot borrow more than 3 books at a time' });
            }

            // Issue the book
            db.query('INSERT INTO issued_books (user_id, book_id, due_date) VALUES (?, ?, ?)', [userId, book_id, due_date], (err, issueResult) => {
                if (err) return res.status(500).json({ error: err.message });

                // Decrease available copies in books table
                db.query('UPDATE books SET available_copies = available_copies - 1 WHERE book_id = ?', [book_id], (err, updateResult) => {
                    if (err) return res.status(500).json({ error: err.message });

                    res.status(201).json({ message: 'Book issued successfully', issue_id: issueResult.insertId });
                });
            });
        });
    });
});

// 📌 Return a book
router.post('/return', authenticateUser, (req, res) => {
    const userId = req.user.user_id; // Get user ID from token
    const { book_id } = req.body;

    if (!book_id) {
        return res.status(400).json({ error: 'Book ID is required' });
    }

    // Check if the book was issued to the user and not yet returned
    db.query('SELECT * FROM issued_books WHERE user_id = ? AND book_id = ? AND returned = FALSE', [userId, book_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length === 0) return res.status(404).json({ error: 'No active book issue found for this user' });

        const issueRecord = result[0];
        const dueDate = new Date(issueRecord.due_date);
        const returnDate = new Date();
        let lateFee = 0;

        // 📌 Check for late return (Optional: Apply penalty if overdue)
        if (returnDate > dueDate) {
            const daysLate = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
            lateFee = daysLate * 10; // Example: ₹10 per day late fee
        }

        // 📌 Update the book return status
        db.query('UPDATE issued_books SET returned = TRUE, return_date = NOW() WHERE issue_id = ?', [issueRecord.issue_id], (err, updateResult) => {
            if (err) return res.status(500).json({ error: err.message });

            // 📌 Increase available copies in the books table
            db.query('UPDATE books SET available_copies = available_copies + 1 WHERE book_id = ?', [book_id], (err, bookUpdateResult) => {
                if (err) return res.status(500).json({ error: err.message });

                res.json({ message: 'Book returned successfully', late_fee: lateFee });
            });
        });
    });
});

// 📌 Get all issued books (Admin only)
router.get('/all', authenticateUser, authenticateAdmin, (req, res) => {
    db.query(
        `SELECT ib.issue_id, u.name AS user_name, b.title, ib.issue_date, ib.due_date, ib.returned, ib.return_date 
         FROM issued_books ib 
         JOIN users u ON ib.user_id = u.user_id
         JOIN books b ON ib.book_id = b.book_id`, 
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        }
    );
});

// 📌 Get issued books for logged-in user
router.get('/my', authenticateUser, (req, res) => {
    const userId = req.user.user_id;

    db.query(
        `SELECT ib.issue_id, b.title, ib.issue_date, ib.due_date, ib.returned, ib.return_date 
         FROM issued_books ib 
         JOIN books b ON ib.book_id = b.book_id 
         WHERE ib.user_id = ?`, 
        [userId], 
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        }
    );
});


module.exports = router;
