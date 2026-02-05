import express from 'express';
import cors from 'cors';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import decisionsRouter from './routes/decisions.js';
import assessmentsRouter from './routes/assessments.js';
import responsibilitiesRouter from './routes/responsibilities.js';
import conclusionsRouter from './routes/conclusions.js';
import statusRouter from './routes/status.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(authMiddleware);

// Routes
app.use('/api/decisions', decisionsRouter);
app.use('/api/decisions/:id/assessments', assessmentsRouter);
app.use('/api/decisions/:id/responsibilities', responsibilitiesRouter);
app.use('/api', conclusionsRouter);
app.use('/api/status', statusRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
