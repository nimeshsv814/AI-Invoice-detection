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
exports.checkInvoice = checkInvoice;
exports.getAlerts = getAlerts;
exports.resolveAlert = resolveAlert;
const duplicateService = __importStar(require("../services/duplicate.service"));
const response_1 = require("../utils/response");
const error_middleware_1 = require("../middleware/error.middleware");
async function checkInvoice(req, res, next) {
    try {
        const { invoiceId, invoiceNumber, vendorName, totalAmount, invoiceDate, poNumber } = req.body;
        if (!invoiceId) {
            throw new error_middleware_1.AppError('invoiceId is required', 400);
        }
        const result = await duplicateService.checkForDuplicates({
            invoiceId,
            invoiceNumber,
            vendorName,
            totalAmount,
            invoiceDate,
            poNumber,
        });
        (0, response_1.sendSuccess)(res, result, 'Duplicate check completed');
    }
    catch (err) {
        next(err);
    }
}
async function getAlerts(req, res, next) {
    try {
        const alerts = await duplicateService.getDuplicateAlerts();
        (0, response_1.sendSuccess)(res, alerts);
    }
    catch (err) {
        next(err);
    }
}
async function resolveAlert(req, res, next) {
    try {
        const { id } = req.params;
        const { status, resolvedBy, notes } = req.body;
        if (!status || !resolvedBy) {
            throw new error_middleware_1.AppError('status and resolvedBy are required', 400);
        }
        if (status !== 'confirmed_duplicate' && status !== 'false_positive') {
            throw new error_middleware_1.AppError('Invalid resolution status', 400);
        }
        await duplicateService.resolveDuplicate(id, status, resolvedBy, notes);
        (0, response_1.sendSuccess)(res, null, 'Duplicate alert resolved successfully');
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=duplicate.controller.js.map