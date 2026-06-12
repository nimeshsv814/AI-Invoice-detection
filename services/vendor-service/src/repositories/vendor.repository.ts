import { query } from '../config/database';

export async function findVendors(filters: { status?: string; search?: string }): Promise<any[]> {
  let selectQuery = `SELECT * FROM vendors WHERE 1=1`;
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.status) {
    selectQuery += ` AND status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }

  if (filters.search) {
    const searchVal = `%${filters.search}%`;
    selectQuery += ` AND (company_name ILIKE $${paramIndex} OR vendor_code ILIKE $${paramIndex})`;
    params.push(searchVal);
    paramIndex++;
  }

  selectQuery += ` ORDER BY company_name ASC`;
  const result = await query(selectQuery, params);
  return result.rows;
}

export async function findVendorById(id: string): Promise<any> {
  const vendorResult = await query(`SELECT * FROM vendors WHERE id = $1 LIMIT 1`, [id]);
  if (vendorResult.rowCount === 0) return null;
  const vendor = vendorResult.rows[0];

  const assessmentsResult = await query(
    `SELECT * FROM vendor_risk_assessments WHERE vendor_id = $1 ORDER BY assessed_at DESC`,
    [id]
  );
  vendor.riskAssessments = assessmentsResult.rows;

  return vendor;
}

export async function findVendorByCode(code: string): Promise<any> {
  const result = await query(`SELECT * FROM vendors WHERE LOWER(vendor_code) = LOWER($1) LIMIT 1`, [code]);
  return result.rows[0] || null;
}

export async function createVendor(vendor: {
  vendorCode: string;
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  paymentTerms?: number;
  currency?: string;
  category?: string;
  createdBy: string;
}): Promise<any> {
  const result = await query(
    `INSERT INTO vendors 
       (vendor_code, company_name, contact_name, email, phone, address_line1, address_line2, city, state, postal_code, country, tax_id, payment_terms, currency, category, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING *`,
    [
      vendor.vendorCode,
      vendor.companyName,
      vendor.contactName || null,
      vendor.email || null,
      vendor.phone || null,
      vendor.addressLine1 || null,
      vendor.addressLine2 || null,
      vendor.city || null,
      vendor.state || null,
      vendor.postalCode || null,
      vendor.country || 'US',
      vendor.taxId || null,
      vendor.paymentTerms || 30,
      vendor.currency || 'USD',
      vendor.category || null,
      vendor.createdBy,
    ]
  );
  return result.rows[0];
}

export async function updateVendor(id: string, updates: Record<string, any>): Promise<any> {
  const keys = Object.keys(updates);
  if (keys.length === 0) return findVendorById(id);

  const setClauses = keys.map((key, i) => {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    return `${snakeKey} = $${i + 2}`;
  });

  const values = keys.map((k) => updates[k]);

  await query(
    `UPDATE vendors SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $1`,
    [id, ...values]
  );

  return findVendorById(id);
}

export async function createRiskAssessment(assessment: {
  vendorId: string;
  riskScore: number;
  trustScore: number;
  riskLevel: string;
  riskFactors: string[];
  recommendations: string[];
  assessedBy: string;
  notes?: string;
}): Promise<any> {
  const result = await query(
    `INSERT INTO vendor_risk_assessments 
       (vendor_id, risk_score, trust_score, risk_level, risk_factors, recommendations, assessed_by, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      assessment.vendorId,
      assessment.riskScore,
      assessment.trustScore,
      assessment.riskLevel,
      JSON.stringify(assessment.riskFactors),
      JSON.stringify(assessment.recommendations),
      assessment.assessedBy,
      assessment.notes || null,
    ]
  );
  return result.rows[0];
}
