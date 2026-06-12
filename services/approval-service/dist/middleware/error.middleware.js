"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorMiddleware = errorMiddleware;
const logger_1 = __importDefault(require("../utils/logger"));
const response_1 = require("../utils/response");
class AppError extends Error {
    constructor(message, statusCode = 500, errors = null) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
function errorMiddleware(err, req, res, next) {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    const errors = err.errors || null;
    // Log errors
    if (statusCode >= 500) {
        logger_1.default.error(`${req.method} ${req.url} - ${message}\nStack: ${err.stack}`);
    }
    else {
        logger_1.default.warn(`${req.method} ${req.url} - ${statusCode} - ${message}`);
    }
    (0, response_1.sendError)(res, message, statusCode, errors);
}
//# sourceMappingURL=error.middleware.js.map