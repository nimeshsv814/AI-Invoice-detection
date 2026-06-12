import app, { connectDatabase, connectRedis } from './app';
import logger from './utils/logger';

const PORT = parseInt(process.env.PORT || '3006', 10);

async function bootstrap() {
  try {
    await connectDatabase();
    await connectRedis();
    app.listen(PORT, () => {
      logger.info(`Approval service is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start approval service:', error);
    process.exit(1);
  }
}

bootstrap();
