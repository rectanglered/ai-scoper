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
// Health check moved or removed to allow UI to load
// app.get('/', (req, res) => res.send('API Running'));

// Serve static files from the React client
const clientBuildPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));

// Handle React routing, return all requests to React app
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
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
