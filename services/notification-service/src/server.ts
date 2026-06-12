import app, { connectDatabase, connectRedis } from './app';
import logger from './utils/logger';

const PORT = parseInt(process.env.PORT || '3008', 10);

async function bootstrap() {
  try {
    await connectDatabase();
    await connectRedis();
    app.listen(PORT, () => logger.info(`Notification service running on port ${PORT}`));
  } catch (err) {
    logger.error('Failed to start notification service:', err);
    process.exit(1);
  }
}

bootstrap();
