import app, { connectDatabase, connectRedis } from './app';
import logger from './utils/logger';

const PORT = parseInt(process.env.PORT || '3002', 10);

async function bootstrap() {
  try {
    await connectDatabase();
    await connectRedis();
    app.listen(PORT, () => {
      logger.info(`Invoice service is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start invoice service:', error);
    process.exit(1);
  }
}

bootstrap();
