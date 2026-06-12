import { Router } from 'express';
import * as controller from '../controllers/duplicate.controller';

const router = Router();

router.post('/duplicate/check', controller.checkInvoice);
router.get('/duplicate/alerts', controller.getAlerts);
router.post('/duplicate/resolve/:id', controller.resolveAlert);

export default router;
