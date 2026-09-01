// Builds and wires the Express application: JSON parsing, the static front-end,
// and the upload routes. Exported WITHOUT calling listen() so tests can import
// the app directly; server.js is what actually starts it.

const express = require('express');
const path = require('node:path');

const uploadRouter = require('./routes/upload');

const app = express();
app.use(express.json());

// Static front-end: serves public/index.html at "/" and public/style.css at
// "/style.css". (Replaces the two manual sendFile routes.)
app.use(express.static(path.join(__dirname, 'public')));

// Upload API (POST /upload/:type).
app.use('/', uploadRouter);

module.exports = app;
