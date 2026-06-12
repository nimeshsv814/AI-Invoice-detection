import { Router } from 'express';
import * as controller from '../controllers/ocr.controller';

const router = Router();
router.post('/ocr/process', controller.processInvoice);
router.get('/ocr/result/:invoiceId', controller.getResult);

export default router;
