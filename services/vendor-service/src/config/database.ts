import { Pool, PoolClient } from 'pg';
import logger from '../utils/logger';

let pool: Pool;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'invoiceadmin',
      password: process.env.DB_PASSWORD || 'invoice@Pass123',
      database: process.env.DB_NAME || 'invoicedb',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      logger.error('Unexpected database pool error:', err);
    });
  }
  return pool;
}

export async function connectDatabase(): Promise<void> {
  const p = getPool();
  const client = await p.connect();
  logger.info('Connected to PostgreSQL database successfully.');
  client.release();
}

export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number | null }> {
  const start = Date.now();
  const result = await getPool().query(text, params);
  const duration = Date.now() - start;
  if (duration > 1000) {
    logger.warn(`Slow query detected (${duration}ms): ${text.substring(0, 100)}`);
  }
  return result;
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
