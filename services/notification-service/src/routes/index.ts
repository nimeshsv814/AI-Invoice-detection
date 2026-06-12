import { Router } from 'express';
import * as controller from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Internal endpoint (called by other services)
router.post('/notifications', controller.createNotification);

// Authenticated user endpoints
router.get('/notifications', authenticate, controller.getMyNotifications);
router.patch('/notifications/:id/read', authenticate, controller.markRead);
router.patch('/notifications/read-all', authenticate, controller.markAllRead);

export default router;
