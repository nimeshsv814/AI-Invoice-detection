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
exports.getVendors = getVendors;
exports.getVendor = getVendor;
exports.createVendor = createVendor;
exports.updateVendor = updateVendor;
exports.assessVendor = assessVendor;
const vendorService = __importStar(require("../services/vendor.service"));
const response_1 = require("../utils/response");
const error_middleware_1 = require("../middleware/error.middleware");
async function getVendors(req, res, next) {
    try {
        const status = req.query.status;
        const search = req.query.search;
        const vendors = await vendorService.getAllVendors({ status, search });
        (0, response_1.sendSuccess)(res, vendors);
    }
    catch (err) {
        next(err);
    }
}
async function getVendor(req, res, next) {
    try {
        const vendor = await vendorService.getVendor(req.params.id);
        (0, response_1.sendSuccess)(res, vendor);
    }
    catch (err) {
        next(err);
    }
}
async function createVendor(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401);
        }
        const vendor = await vendorService.createVendor(req.body, userId);
        (0, response_1.sendSuccess)(res, vendor, 'Vendor created successfully');
    }
    catch (err) {
        next(err);
    }
}
async function updateVendor(req, res, next) {
    try {
        const vendor = await vendorService.updateVendor(req.params.id, req.body);
        (0, response_1.sendSuccess)(res, vendor, 'Vendor updated successfully');
    }
    catch (err) {
        next(err);
    }
}
async function assessVendor(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401);
        }
        const result = await vendorService.assessVendorRisk(req.params.id, userId, req.body.notes);
        (0, response_1.sendSuccess)(res, result, 'Vendor risk assessment completed');
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=vendor.controller.js.map