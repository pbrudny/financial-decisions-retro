import express from 'express';
import cors from 'cors';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import decisionsRouter from './routes/decisions.js';
import assessmentsRouter from './routes/assessments.js';
import responsibilitiesRouter from './routes/responsibilities.js';
import conclusionsRouter from './routes/conclusions.js';
import statusRouter from './routes/status.js';

export function createApp() {
  const app = express();

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

  return app;
}
