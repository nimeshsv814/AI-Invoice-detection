import { Application } from 'express';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
declare const app: Application;
export { connectDatabase, connectRedis };
export default app;
