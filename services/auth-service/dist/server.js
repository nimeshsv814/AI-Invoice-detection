"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const logger_1 = __importDefault(require("./utils/logger"));
const PORT = parseInt(process.env.PORT || '3001', 10);
async function bootstrap() {
    try {
        // Connect to database
        await (0, database_1.connectDatabase)();
        // Connect to Redis
        await (0, redis_1.connectRedis)();
        // Start server
        app_1.default.listen(PORT, () => {
            logger_1.default.info(`Auth service is running on port ${PORT}`);
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start auth service:', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=server.js.map