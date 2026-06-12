"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
exports.findNotificationsByUser = findNotificationsByUser;
exports.markAsRead = markAsRead;
exports.markAllAsRead = markAllAsRead;
exports.getUnreadCount = getUnreadCount;
const database_1 = require("../config/database");
async function createNotification(notification) {
    const result = await (0, database_1.query)(`INSERT INTO notifications
       (user_id, type, title, message, channel, priority, action_url, reference_id, reference_type, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`, [
        notification.userId,
        notification.type,
        notification.title,
        notification.message,
        notification.channel || 'in_app',
        notification.priority || 'normal',
        notification.actionUrl || null,
        notification.referenceId || null,
        notification.referenceType || null,
        notification.metadata ? JSON.stringify(notification.metadata) : null,
    ]);
    return result.rows[0];
}
async function findNotificationsByUser(userId, filters) {
    let whereClause = `WHERE user_id = $1`;
    const params = [userId];
    let paramIndex = 2;
    if (filters.isRead !== undefined) {
        whereClause += ` AND is_read = $${paramIndex}`;
        params.push(filters.isRead);
        paramIndex++;
    }
    if (filters.type) {
        whereClause += ` AND type = $${paramIndex}`;
        params.push(filters.type);
        paramIndex++;
    }
    const countResult = await (0, database_1.query)(`SELECT COUNT(*) FROM notifications ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    const result = await (0, database_1.query)(`SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, [...params, limit, offset]);
    return { notifications: result.rows, total };
}
async function markAsRead(id, userId) {
    const result = await (0, database_1.query)(`UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *`, [id, userId]);
    return result.rows[0] || null;
}
async function markAllAsRead(userId) {
    const result = await (0, database_1.query)(`UPDATE notifications SET is_read = true, read_at = NOW() WHERE user_id = $1 AND is_read = false`, [userId]);
    return result.rowCount || 0;
}
async function getUnreadCount(userId) {
    const result = await (0, database_1.query)(`SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`, [userId]);
    return parseInt(result.rows[0].count, 10);
}
//# sourceMappingURL=notification.repository.js.map