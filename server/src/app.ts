import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createApp } from './createApp.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = createApp();
const PORT = process.env.PORT || 3001;

// Serve static client in production
const clientDist = process.env.CLIENT_DIST || join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
