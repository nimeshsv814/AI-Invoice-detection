"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectRedis = exports.connectDatabase = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const database_1 = require("./config/database");
Object.defineProperty(exports, "connectDatabase", { enumerable: true, get: function () { return database_1.connectDatabase; } });
const redis_1 = require("./config/redis");
Object.defineProperty(exports, "connectRedis", { enumerable: true, get: function () { return redis_1.connectRedis; } });
const routes_1 = __importDefault(require("./routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const logger_1 = __importDefault(require("./utils/logger"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: '*', credentials: true }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use((0, morgan_1.default)('combined', { stream: { write: (m) => logger_1.default.http(m.trim()) } }));
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'vendor-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
app.use('/api', routes_1.default);
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(error_middleware_1.errorMiddleware);
exports.default = app;
//# sourceMappingURL=app.js.map