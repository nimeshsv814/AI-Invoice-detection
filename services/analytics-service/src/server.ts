import app, { connectDatabase, connectRedis } from './app';
import logger from './utils/logger';

const PORT = parseInt(process.env.PORT || '3009', 10);

async function bootstrap() {
  try {
    await connectDatabase();
    await connectRedis();
    app.listen(PORT, () => logger.info(`Analytics service running on port ${PORT}`));
  } catch (err) {
    logger.error('Failed to start analytics service:', err);
    process.exit(1);
  }
}

bootstrap();
