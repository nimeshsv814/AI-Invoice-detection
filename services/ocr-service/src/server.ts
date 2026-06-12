import app, { connectDatabase, connectRedis } from './app';
import logger from './utils/logger';
const PORT = parseInt(process.env.PORT || '3003', 10);
async function bootstrap() {
  try {
    await connectDatabase(); await connectRedis();
    app.listen(PORT, '0.0.0.0', () => logger.info(`✅ OCR Service on port ${PORT}`));
  } catch (err) { logger.error('Failed to start:', err); process.exit(1); }
}
bootstrap();
