import * as notificationRepo from '../repositories/notification.repository';
import { sendEmail, buildEmailHtml } from '../config/email';
import { query } from '../config/database';
import logger from '../utils/logger';

export async function createNotification(data: {
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
  // Persist to database
  const notification = await notificationRepo.createNotification(data);

  // Send email if channel is 'email' or 'both'
  if (data.channel === 'email' || data.channel === 'both') {
    // Look up user email
    try {
      const userResult = await query<any>(
        `SELECT email, first_name FROM users WHERE id = $1 LIMIT 1`,
        [data.userId]
      );
      if (userResult.rowCount && userResult.rowCount > 0) {
        const user = userResult.rows[0];
        const html = buildEmailHtml(data.title, data.message, data.priority || 'normal');
        const sent = await sendEmail({
          to: user.email,
          subject: `[InvoiceAI] ${data.title}`,
          html,
        });

        if (sent) {
          await query(
            `UPDATE notifications SET email_sent = true, email_sent_at = NOW() WHERE id = $1`,
            [notification.id]
          );
        }
      }
    } catch (err: any) {
      logger.warn(`Could not send email for notification ${notification.id}: ${err.message}`);
    }
  }

  return notification;
}

export async function getNotifications(
  userId: string,
  options: { page?: number; limit?: number; isRead?: string; type?: string }
) {
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

export async function markRead(notificationId: string, userId: string) {
  return notificationRepo.markAsRead(notificationId, userId);
}

export async function markAllRead(userId: string) {
  const count = await notificationRepo.markAllAsRead(userId);
  return { markedRead: count };
}
