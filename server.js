const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 8000;

// Enable CORS for all routes
app.use(cors());

// Serve static files from project root
app.use(express.static(__dirname));

// Handle API routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});