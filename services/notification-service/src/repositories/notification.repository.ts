import { query } from '../config/database';

export async function createNotification(notification: {
  userId: string;
  type: string;
  title: string;
  message: string;
  channel?: string;
  priority?: string;
  actionUrl?: string;
  referenceId?: string;
  referenceType?: string;
  metadata?: any;
}): Promise<any> {
  const result = await query(
    `INSERT INTO notifications
       (user_id, type, title, message, channel, priority, action_url, reference_id, reference_type, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
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
    ]
  );
  return result.rows[0];
}

export async function findNotificationsByUser(
  userId: string,
  filters: { isRead?: boolean; type?: string; limit?: number; offset?: number }
): Promise<{ notifications: any[]; total: number }> {
  let whereClause = `WHERE user_id = $1`;
  const params: any[] = [userId];
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

  const countResult = await query(`SELECT COUNT(*) FROM notifications ${whereClause}`, params);
  const total = parseInt(countResult.rows[0].count, 10);

  const limit = filters.limit || 20;
  const offset = filters.offset || 0;

  const result = await query(
    `SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  return { notifications: result.rows, total };
}

export async function markAsRead(id: string, userId: string): Promise<any> {
  const result = await query(
    `UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId]
  );
  return result.rows[0] || null;
}

export async function markAllAsRead(userId: string): Promise<number> {
  const result = await query(
    `UPDATE notifications SET is_read = true, read_at = NOW() WHERE user_id = $1 AND is_read = false`,
    [userId]
  );
  return result.rowCount || 0;
}

export async function getUnreadCount(userId: string): Promise<number> {
  const result = await query(
    `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
}
