import { Router } from 'express';
import * as controller from '../controllers/vendor.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/vendors', authenticate, controller.getVendors);
router.get('/vendors/:id', authenticate, controller.getVendor);
router.post('/vendors', authenticate, authorize('admin', 'vendor_manager'), controller.createVendor);
router.put('/vendors/:id', authenticate, authorize('admin', 'vendor_manager'), controller.updateVendor);
router.post('/vendors/:id/assess', authenticate, authorize('admin', 'vendor_manager', 'finance_manager'), controller.assessVendor);

export default router;
