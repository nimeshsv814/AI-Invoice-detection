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
exports.startWorkflow = startWorkflow;
exports.getWorkflow = getWorkflow;
exports.performAction = performAction;
exports.getQueue = getQueue;
const approvalService = __importStar(require("../services/approval.service"));
const response_1 = require("../utils/response");
const error_middleware_1 = require("../middleware/error.middleware");
async function startWorkflow(req, res, next) {
    try {
        const { invoiceId, aiRecommendation, aiConfidence, aiExplanation, priority } = req.body;
        if (!invoiceId) {
            throw new error_middleware_1.AppError('invoiceId is required', 400);
        }
        const result = await approvalService.startWorkflow({
            invoiceId,
            aiRecommendation,
            aiConfidence,
            aiExplanation,
            priority,
        });
        (0, response_1.sendSuccess)(res, result, 'Workflow started');
    }
    catch (err) {
        next(err);
    }
}
async function getWorkflow(req, res, next) {
    try {
        const { invoiceId } = req.params;
        const result = await approvalService.getWorkflow(invoiceId);
        (0, response_1.sendSuccess)(res, result);
    }
    catch (err) {
        next(err);
    }
}
async function performAction(req, res, next) {
    try {
        const { invoiceId, action, comments, escalatedTo } = req.body;
        if (!invoiceId || !action) {
            throw new error_middleware_1.AppError('invoiceId and action are required', 400);
        }
        const userId = req.user?.userId;
        const userName = req.user ? `${req.user.email}` : 'System/API'; // or query DB for full name
        const result = await approvalService.recordAction({
            invoiceId,
            action,
            performedBy: userId,
            performerName: userName,
            comments,
            escalatedTo,
        });
        (0, response_1.sendSuccess)(res, result, `Workflow action [${action}] recorded`);
    }
    catch (err) {
        next(err);
    }
}
async function getQueue(req, res, next) {
    try {
        const status = req.query.status;
        const priority = req.query.priority;
        const assignedTo = req.query.assignedTo || req.user?.userId; // default to current user if filter not set
        const queue = await approvalService.getQueue({
            assignedTo,
            status,
            priority,
        });
        (0, response_1.sendSuccess)(res, queue);
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=approval.controller.js.map