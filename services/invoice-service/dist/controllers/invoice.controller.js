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
exports.uploadInvoice = uploadInvoice;
exports.getInvoices = getInvoices;
exports.getInvoice = getInvoice;
exports.getDashboard = getDashboard;
exports.updateStatus = updateStatus;
const invoiceService = __importStar(require("../services/invoice.service"));
const response_1 = require("../utils/response");
async function uploadInvoice(req, res, next) {
    try {
        if (!req.file) {
            (0, response_1.sendError)(res, 'No file uploaded', 400);
            return;
        }
        const invoice = await invoiceService.uploadInvoice(req.file, req.user.userId, req.user.email);
        (0, response_1.sendCreated)(res, invoice, 'Invoice uploaded successfully. Processing started.');
    }
    catch (err) {
        next(err);
    }
}
async function getInvoices(req, res, next) {
    try {
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '20', 10);
        const { invoices, total } = await invoiceService.getInvoices({
            page, limit,
            status: req.query.status,
            vendorId: req.query.vendorId,
            search: req.query.search,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            minAmount: req.query.minAmount ? parseFloat(req.query.minAmount) : undefined,
            maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount) : undefined,
            uploadedBy: req.user?.role !== 'admin' && req.user?.role !== 'finance_manager'
                ? req.user?.userId : req.query.uploadedBy,
        });
        (0, response_1.sendPaginated)(res, invoices, total, page, limit);
    }
    catch (err) {
        next(err);
    }
}
async function getInvoice(req, res, next) {
    try {
        const invoice = await invoiceService.getInvoiceById(req.params.id);
        (0, response_1.sendSuccess)(res, invoice);
    }
    catch (err) {
        next(err);
    }
}
async function getDashboard(req, res, next) {
    try {
        const stats = await invoiceService.getDashboardStats();
        (0, response_1.sendSuccess)(res, stats);
    }
    catch (err) {
        next(err);
    }
}
async function updateStatus(req, res, next) {
    try {
        const invoice = await invoiceService.updateInvoiceStatus(req.params.id, req.body.status, req.body.comments);
        (0, response_1.sendSuccess)(res, invoice, 'Status updated');
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=invoice.controller.js.map