import { Router } from 'express';
import * as controller from '../controllers/invoice.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { upload } from '../config/upload';

const router = Router();

// Dashboard stats
router.get('/invoices/dashboard', authenticate, controller.getDashboard);

// Upload invoice (PDF, image, scan)
router.post('/invoices/upload', authenticate, upload.single('invoice'), controller.uploadInvoice);

// List invoices with filters
router.get('/invoices', authenticate, controller.getInvoices);

// Get specific invoice with line items
router.get('/invoices/:id', authenticate, controller.getInvoice);

// Update invoice status (admin/manager only)
router.patch('/invoices/:id/status', authenticate, authorize('admin', 'finance_manager'), controller.updateStatus);

export default router;
