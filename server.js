const express = require('express');
const db = require('./config/db');
require('dotenv').config();

const app = express();
app.use(express.json()); // Enables JSON request handling

const bookRoutes = require('./routes/books');
app.use('/api', bookRoutes); // Register book API routes

const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

const cors = require('cors');
app.use(cors({ origin: "https://sumith-chiluka.github.io" }));

console.log("📌 Issue Routes Loaded");
const issueRoutes = require('./routes/issue');
app.use('/api/issue', issueRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
