"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPool = getPool;
exports.connectDatabase = connectDatabase;
exports.query = query;
exports.withTransaction = withTransaction;
const pg_1 = require("pg");
const logger_1 = __importDefault(require("../utils/logger"));
let pool;
function getPool() {
    if (!pool) {
        pool = new pg_1.Pool({
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
            logger_1.default.error('Unexpected database pool error:', err);
        });
    }
    return pool;
}
async function connectDatabase() {
    const p = getPool();
    const client = await p.connect();
    logger_1.default.info('Connected to PostgreSQL database successfully.');
    client.release();
}
async function query(text, params) {
    const start = Date.now();
    const result = await getPool().query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
        logger_1.default.warn(`Slow query detected (${duration}ms): ${text.substring(0, 100)}`);
    }
    return result;
}
async function withTransaction(callback) {
    const client = await getPool().connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
//# sourceMappingURL=database.js.map