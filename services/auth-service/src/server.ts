import app from './app';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import logger from './utils/logger';

const PORT = parseInt(process.env.PORT || '3001', 10);

async function bootstrap() {
  try {
    // Connect to database
    await connectDatabase();

    // Connect to Redis
    await connectRedis();

    // Start server
    app.listen(PORT, () => {
      logger.info(`Auth service is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start auth service:', error);
    process.exit(1);
  }
}

bootstrap();
