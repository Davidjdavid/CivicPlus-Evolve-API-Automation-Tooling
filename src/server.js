// Entry point: start the HTTP server. Everything else is wired up in app.js.
const app = require('./app');

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
