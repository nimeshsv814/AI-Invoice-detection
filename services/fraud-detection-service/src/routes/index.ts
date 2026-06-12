import { Router } from 'express';
import * as controller from '../controllers/fraud.controller';

const router = Router();

router.post('/fraud/analyze', controller.analyzeInvoice);
router.get('/fraud/score/:invoiceId', controller.getScore);
router.get('/fraud/trends', controller.getTrends);
router.get('/fraud/high-risk-vendors', controller.getHighRiskVendors);

export default router;
