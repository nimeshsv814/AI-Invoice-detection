import { RedisClientType } from 'redis';
export declare function connectRedis(): Promise<void>;
export declare function getRedisClient(): RedisClientType;
