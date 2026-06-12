import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
declare const app: import("express-serve-static-core").Express;
export { connectDatabase, connectRedis };
export default app;
