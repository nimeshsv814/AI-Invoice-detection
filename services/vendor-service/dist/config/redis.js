"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectRedis = connectRedis;
exports.getRedisClient = getRedisClient;
const redis_1 = require("redis");
const logger_1 = __importDefault(require("../utils/logger"));
let client;
async function connectRedis() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = process.env.REDIS_PORT || '6379';
    const url = `redis://${host}:${port}`;
    client = (0, redis_1.createClient)({ url });
    client.on('error', (err) => {
        logger_1.default.error('Redis client error:', err);
    });
    client.on('connect', () => {
        logger_1.default.info('Connected to Redis server successfully.');
    });
    await client.connect();
}
function getRedisClient() {
    if (!client) {
        throw new Error('Redis client not initialized. Call connectRedis first.');
    }
    return client;
}
//# sourceMappingURL=redis.js.map