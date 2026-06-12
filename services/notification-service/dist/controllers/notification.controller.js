"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
exports.getMyNotifications = getMyNotifications;
exports.markRead = markRead;
exports.markAllRead = markAllRead;
const notificationService = __importStar(require("../services/notification.service"));
const response_1 = require("../utils/response");
const error_middleware_1 = require("../middleware/error.middleware");
async function createNotification(req, res, next) {
    try {
        const { userId, type, title, message, channel, priority, actionUrl, referenceId, referenceType, metadata } = req.body;
        if (!userId || !type || !title || !message) {
            throw new error_middleware_1.AppError('userId, type, title, and message are required', 400);
        }
        const notification = await notificationService.createNotification({
            userId, type, title, message, channel, priority, actionUrl, referenceId, referenceType, metadata,
        });
        (0, response_1.sendSuccess)(res, notification, 'Notification created');
    }
    catch (err) {
        next(err);
    }
}
async function getMyNotifications(req, res, next) {
    try {
        if (!req.user)
            throw new error_middleware_1.AppError('Not authenticated', 401);
        const { page, limit, isRead, type } = req.query;
        const result = await notificationService.getNotifications(req.user.userId, { page: +page || 1, limit: +limit || 20, isRead, type });
        (0, response_1.sendSuccess)(res, result);
    }
    catch (err) {
        next(err);
    }
}
async function markRead(req, res, next) {
    try {
        if (!req.user)
            throw new error_middleware_1.AppError('Not authenticated', 401);
        const updated = await notificationService.markRead(req.params.id, req.user.userId);
        if (!updated)
            throw new error_middleware_1.AppError('Notification not found', 404);
        (0, response_1.sendSuccess)(res, updated, 'Marked as read');
    }
    catch (err) {
        next(err);
    }
}
async function markAllRead(req, res, next) {
    try {
        if (!req.user)
            throw new error_middleware_1.AppError('Not authenticated', 401);
        const result = await notificationService.markAllRead(req.user.userId);
        (0, response_1.sendSuccess)(res, result, 'All notifications marked as read');
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=notification.controller.js.map