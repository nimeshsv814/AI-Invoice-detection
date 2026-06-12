import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import routes from './routes';
import { errorMiddleware } from './middleware/error.middleware';
import logger from './utils/logger';

const app = express();
app.use(helmet()); app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (m) => logger.http(m.trim()) } }));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'ocr-service', timestamp: new Date().toISOString() }));
app.use('/api', routes);
app.use((_req, res) => res.status(404).json({ success: false, message: 'Not found' }));
app.use(errorMiddleware);

export { connectDatabase, connectRedis };
export default app;
