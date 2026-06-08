import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { clientRoutes } from './routes/clients';
import { analyticsRoutes } from './routes/analytics';
import { calendarRoutes } from './routes/calendar';
import { contentRoutes } from './routes/content';
import { aiRoutes } from './routes/ai';
import { reportRoutes } from './routes/reports';
import { notificationRoutes } from './routes/notifications';
import { settingsRoutes } from './routes/settings';
import { errorHandler } from './middleware/errorHandler';
import { initDatabase } from './utils/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: ['http://localhost:3000', 'file://'] }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for uploads
app.use('/storage', express.static(path.join(process.cwd(), '../storage')));

// Routes
app.use('/api/clients', clientRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    logger.info(`SocialPilot Backend running on port ${PORT}`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
