"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller = __importStar(require("../controllers/invoice.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_1 = require("../config/upload");
const router = (0, express_1.Router)();
// Dashboard stats
router.get('/invoices/dashboard', auth_middleware_1.authenticate, controller.getDashboard);
// Upload invoice (PDF, image, scan)
router.post('/invoices/upload', auth_middleware_1.authenticate, upload_1.upload.single('invoice'), controller.uploadInvoice);
// List invoices with filters
router.get('/invoices', auth_middleware_1.authenticate, controller.getInvoices);
// Get specific invoice with line items
router.get('/invoices/:id', auth_middleware_1.authenticate, controller.getInvoice);
// Update invoice status (admin/manager only)
router.patch('/invoices/:id/status', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'finance_manager'), controller.updateStatus);
exports.default = router;
//# sourceMappingURL=index.js.map