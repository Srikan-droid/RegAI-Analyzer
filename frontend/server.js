// server.js - simple static server for React build (robust fallback)
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BUILD_DIR = path.join(__dirname, 'build');

// Serve static files from build
app.use(express.static(BUILD_DIR));

// SPA fallback: for any request not handled by static middleware, return index.html
app.use((req, res) => {
  res.sendFile(path.join(BUILD_DIR, 'index.html'), (err) => {
    if (err) {
      console.error('Error sending index.html:', err);
      res.status(500).send('Server error');
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  //console.log(`React build served at http://0.0.0.0:${PORT}`);
});