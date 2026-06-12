import { createClient, RedisClientType } from 'redis';
import logger from '../utils/logger';

let client: RedisClientType;

export async function connectRedis(): Promise<void> {
  const host = process.env.REDIS_HOST || 'localhost';
  const port = process.env.REDIS_PORT || '6379';
  const url = `redis://${host}:${port}`;

  client = createClient({ url });

  client.on('error', (err) => {
    logger.error('Redis client error:', err);
  });

  client.on('connect', () => {
    logger.info('Connected to Redis server successfully.');
  });

  await client.connect();
}

export function getRedisClient(): RedisClientType {
  if (!client) {
    throw new Error('Redis client not initialized. Call connectRedis first.');
  }
  return client;
}
