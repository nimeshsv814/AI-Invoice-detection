import { Router } from 'express';
import * as controller from '../controllers/approval.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/approval/start', controller.startWorkflow);
router.get('/approval/workflow/:invoiceId', controller.getWorkflow);
router.post('/approval/action', authenticate, controller.performAction);
router.get('/approval/queue', authenticate, controller.getQueue);

export default router;
