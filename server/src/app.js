const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Health check
app.get('/', (req, res) => {
    res.send('Daniel (AI Scoper) API is running');
});

// Start server
const { initDb } = require('./database');

if (require.main === module) {
    initDb().then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    });
}

module.exports = app;
