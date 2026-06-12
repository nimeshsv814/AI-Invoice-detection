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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
exports.getNotifications = getNotifications;
exports.markRead = markRead;
exports.markAllRead = markAllRead;
const notificationRepo = __importStar(require("../repositories/notification.repository"));
const email_1 = require("../config/email");
const database_1 = require("../config/database");
const logger_1 = __importDefault(require("../utils/logger"));
async function createNotification(data) {
    // Persist to database
    const notification = await notificationRepo.createNotification(data);
    // Send email if channel is 'email' or 'both'
    if (data.channel === 'email' || data.channel === 'both') {
        // Look up user email
        try {
            const userResult = await (0, database_1.query)(`SELECT email, first_name FROM users WHERE id = $1 LIMIT 1`, [data.userId]);
            if (userResult.rowCount && userResult.rowCount > 0) {
                const user = userResult.rows[0];
                const html = (0, email_1.buildEmailHtml)(data.title, data.message, data.priority || 'normal');
                const sent = await (0, email_1.sendEmail)({
                    to: user.email,
                    subject: `[InvoiceAI] ${data.title}`,
                    html,
                });
                if (sent) {
                    await (0, database_1.query)(`UPDATE notifications SET email_sent = true, email_sent_at = NOW() WHERE id = $1`, [notification.id]);
                }
            }
        }
        catch (err) {
            logger_1.default.warn(`Could not send email for notification ${notification.id}: ${err.message}`);
        }
    }
    return notification;
}
async function getNotifications(userId, options) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;
    const isRead = options.isRead === 'true' ? true : options.isRead === 'false' ? false : undefined;
    const { notifications, total } = await notificationRepo.findNotificationsByUser(userId, {
        isRead,
        type: options.type,
        limit,
        offset,
    });
    const unreadCount = await notificationRepo.getUnreadCount(userId);
    return { notifications, total, unreadCount, page, limit };
}
async function markRead(notificationId, userId) {
    return notificationRepo.markAsRead(notificationId, userId);
}
async function markAllRead(userId) {
    const count = await notificationRepo.markAllAsRead(userId);
    return { markedRead: count };
}
//# sourceMappingURL=notification.service.js.map