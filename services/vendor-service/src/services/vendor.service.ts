import * as vendorRepo from '../repositories/vendor.repository';
import { AppError } from '../middleware/error.middleware';

export async function getAllVendors(filters: { status?: string; search?: string }) {
  return vendorRepo.findVendors(filters);
}

export async function getVendor(id: string) {
  const vendor = await vendorRepo.findVendorById(id);
  if (!vendor) {
    throw new AppError('Vendor not found', 404);
  }
  return vendor;
}

export async function createVendor(
  vendorData: any,
  userId: string
) {
  if (!vendorData.vendorCode || !vendorData.companyName) {
    throw new AppError('vendorCode and companyName are required', 400);
  }

  const existing = await vendorRepo.findVendorByCode(vendorData.vendorCode);
  if (existing) {
    throw new AppError(`Vendor code '${vendorData.vendorCode}' is already taken`, 400);
  }

  return vendorRepo.createVendor({
    ...vendorData,
    createdBy: userId,
  });
}

export async function updateVendor(id: string, data: any) {
  const vendor = await getVendor(id);
  return vendorRepo.updateVendor(id, data);
}

export async function assessVendorRisk(id: string, assessedBy: string, notes?: string): Promise<any> {
  const vendor = await getVendor(id);
  if (!vendor) {
    throw new AppError('Vendor not found', 404);
  }

  // Calculate simulated risk/trust scores
  const riskFactors: string[] = [];
  const recommendations: string[] = [];
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

  const riskLevel =
    riskScore >= 75 ? 'critical' :
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
