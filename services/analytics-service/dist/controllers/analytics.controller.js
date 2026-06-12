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
exports.getDashboard = getDashboard;
exports.getSpendAnalytics = getSpendAnalytics;
exports.getFraudAnalytics = getFraudAnalytics;
exports.getAuditLogs = getAuditLogs;
const analyticsService = __importStar(require("../services/analytics.service"));
const response_1 = require("../utils/response");
async function getDashboard(req, res, next) {
    try {
        const data = await analyticsService.getDashboardKPIs();
        (0, response_1.sendSuccess)(res, data);
    }
    catch (err) {
        next(err);
    }
}
async function getSpendAnalytics(req, res, next) {
    try {
        const period = req.query.period || '12months';
        const data = await analyticsService.getSpendAnalytics(period);
        (0, response_1.sendSuccess)(res, data);
    }
    catch (err) {
        next(err);
    }
}
async function getFraudAnalytics(req, res, next) {
    try {
        const data = await analyticsService.getFraudAnalytics();
        (0, response_1.sendSuccess)(res, data);
    }
    catch (err) {
        next(err);
    }
}
async function getAuditLogs(req, res, next) {
    try {
        const { entityType, userId, action, page, limit } = req.query;
        const data = await analyticsService.getAuditLogs({ entityType, userId, action, page: +page || 1, limit: +limit || 50 });
        (0, response_1.sendSuccess)(res, data);
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=analytics.controller.js.map