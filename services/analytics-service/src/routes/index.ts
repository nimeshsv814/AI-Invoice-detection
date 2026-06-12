import { Router } from 'express';
import * as controller from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/analytics/dashboard', authenticate, controller.getDashboard);
router.get('/analytics/spend', authenticate, controller.getSpendAnalytics);
router.get('/analytics/fraud', authenticate, controller.getFraudAnalytics);
router.get('/analytics/audit-logs', authenticate, controller.getAuditLogs);

export default router;
