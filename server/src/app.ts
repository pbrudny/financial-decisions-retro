import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import decisionsRouter from './routes/decisions.js';
import assessmentsRouter from './routes/assessments.js';
import responsibilitiesRouter from './routes/responsibilities.js';
import conclusionsRouter from './routes/conclusions.js';
import statusRouter from './routes/status.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Auth only for API routes
app.use('/api', authMiddleware);

// Routes
app.use('/api/decisions', decisionsRouter);
app.use('/api/decisions/:id/assessments', assessmentsRouter);
app.use('/api/decisions/:id/responsibilities', responsibilitiesRouter);
app.use('/api', conclusionsRouter);
app.use('/api/status', statusRouter);

// Error handler
app.use(errorHandler);

// Serve static client in production
const clientDist = process.env.CLIENT_DIST || join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
