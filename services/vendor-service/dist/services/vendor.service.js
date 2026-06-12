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
exports.getAllVendors = getAllVendors;
exports.getVendor = getVendor;
exports.createVendor = createVendor;
exports.updateVendor = updateVendor;
exports.assessVendorRisk = assessVendorRisk;
const vendorRepo = __importStar(require("../repositories/vendor.repository"));
const error_middleware_1 = require("../middleware/error.middleware");
async function getAllVendors(filters) {
    return vendorRepo.findVendors(filters);
}
async function getVendor(id) {
    const vendor = await vendorRepo.findVendorById(id);
    if (!vendor) {
        throw new error_middleware_1.AppError('Vendor not found', 404);
    }
    return vendor;
}
async function createVendor(vendorData, userId) {
    if (!vendorData.vendorCode || !vendorData.companyName) {
        throw new error_middleware_1.AppError('vendorCode and companyName are required', 400);
    }
    const existing = await vendorRepo.findVendorByCode(vendorData.vendorCode);
    if (existing) {
        throw new error_middleware_1.AppError(`Vendor code '${vendorData.vendorCode}' is already taken`, 400);
    }
    return vendorRepo.createVendor({
        ...vendorData,
        createdBy: userId,
    });
}
async function updateVendor(id, data) {
    const vendor = await getVendor(id);
    return vendorRepo.updateVendor(id, data);
}
async function assessVendorRisk(id, assessedBy, notes) {
    const vendor = await getVendor(id);
    if (!vendor) {
        throw new error_middleware_1.AppError('Vendor not found', 404);
    }
    // Calculate simulated risk/trust scores
    const riskFactors = [];
    const recommendations = [];
    let baseRisk = 5.0; // starts at low risk
    if (!vendor.tax_id) {
        baseRisk += 25.0;
        riskFactors.push('missing_tax_id');
        recommendations.push('Request tax identification number from vendor.');
    }
    if (!vendor.email || vendor.email.endsWith('.biz') || vendor.email.endsWith('.info')) {
        baseRisk += 15.0;
        riskFactors.push('unprofessional_email_domain');
        recommendations.push('Verify email domain and request corporate email.');
    }
    if (vendor.country && vendor.country !== 'US' && vendor.country !== 'CA' && vendor.country !== 'GB') {
        baseRisk += 20.0;
        riskFactors.push('high_risk_jurisdiction');
        recommendations.push('Complete international trade/anti-bribery compliance review.');
    }
    if (parseFloat(vendor.total_spend) > 500000 && vendor.status === 'under_review') {
        baseRisk += 15.0;
        riskFactors.push('high_spend_under_review');
        recommendations.push('Freeze further payments until audit is finalized.');
    }
    if (vendor.payment_terms < 15) {
        baseRisk += 10.0;
        riskFactors.push('unusual_payment_terms');
        recommendations.push('Renegotiate standard 30-day payment terms if possible.');
    }
    const riskScore = Math.min(100, Math.round(baseRisk));
    const trustScore = 100 - riskScore;
    const riskLevel = riskScore >= 75 ? 'critical' :
        riskScore >= 50 ? 'high' :
            riskScore >= 25 ? 'medium' : 'low';
    if (recommendations.length === 0) {
        recommendations.push('Standard monitoring. Vendor complies with onboarding guidelines.');
    }
    // 1. Save Risk Assessment
    const assessment = await vendorRepo.createRiskAssessment({
        vendorId: id,
        riskScore,
        trustScore,
        riskLevel,
        riskFactors,
        recommendations,
        assessedBy,
        notes: notes || `Automated risk score evaluation: ${riskLevel}`,
    });
    // 2. Update Vendor's risk and trust scores
    const updatedVendor = await vendorRepo.updateVendor(id, {
        riskScore,
        trustScore,
    });
    return {
        vendor: updatedVendor,
        assessment,
    };
}
//# sourceMappingURL=vendor.service.js.map