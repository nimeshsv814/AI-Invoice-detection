import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import routes from './routes';
import { errorMiddleware } from './middleware/error.middleware';
import logger from './utils/logger';

const app: Application = express();

app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (m) => logger.http(m.trim()) } }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'analytics-service', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.use('/api', routes);
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorMiddleware);

export { connectDatabase, connectRedis };
export default app;
