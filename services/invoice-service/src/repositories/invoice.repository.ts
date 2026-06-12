import { query, withTransaction } from '../config/database';
export { query };

export interface InvoiceFilters {
  page: number;
  limit: number;
  status?: string;
  vendorId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  uploadedBy?: string;
}

export async function createInvoice(invoice: {
  id?: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  fileType?: string;
  status: string;
  uploadedBy: string;
}): Promise<any> {
  const result = await query(
    `INSERT INTO invoices (file_name, file_path, file_size, file_type, status, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      invoice.fileName,
      invoice.filePath,
      invoice.fileSize || null,
      invoice.fileType || null,
      invoice.status,
      invoice.uploadedBy,
    ]
  );
  return result.rows[0];
}

export async function createLineItem(item: {
  invoiceId: string;
  lineNumber: number;
  description: string;
  quantity?: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
  productCode?: string;
  category?: string;
}): Promise<any> {
  const result = await query(
    `INSERT INTO invoice_line_items 
       (invoice_id, line_number, description, quantity, unit_price, amount, tax_rate, tax_amount, product_code, category)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      item.invoiceId,
      item.lineNumber,
      item.description,
      item.quantity ?? 1,
      item.unitPrice,
      item.amount,
      item.taxRate || 0,
      item.taxAmount || 0,
      item.productCode || null,
      item.category || null,
    ]
  );
  return result.rows[0];
}

export async function findInvoiceById(id: string): Promise<any> {
  const invoiceResult = await query(
    `SELECT i.*, u.first_name || ' ' || u.last_name as uploader_name
     FROM invoices i
     LEFT JOIN users u ON i.uploaded_by = u.id
     WHERE i.id = $1 LIMIT 1`,
    [id]
  );
  if (invoiceResult.rowCount === 0) return null;
  const invoice = invoiceResult.rows[0];

  const lineItemsResult = await query(
    `SELECT * FROM invoice_line_items WHERE invoice_id = $1 ORDER BY line_number ASC`,
    [id]
  );
  invoice.lineItems = lineItemsResult.rows;

  // Fetch related OCR, duplicate, and fraud records if they exist
  const ocrResult = await query(`SELECT * FROM ocr_results WHERE invoice_id = $1 LIMIT 1`, [id]);
  const fraudResult = await query(`SELECT * FROM fraud_scores WHERE invoice_id = $1 LIMIT 1`, [id]);
  const duplicateResult = await query(
    `SELECT ddr.*, ci.invoice_number AS compared_invoice_number
     FROM duplicate_detection_results ddr
     LEFT JOIN invoices ci ON ddr.compared_invoice_id = ci.id
     WHERE ddr.invoice_id = $1 LIMIT 1`,
    [id]
  );

  invoice.ocrResult = ocrResult.rows[0] || null;
  invoice.fraudResult = fraudResult.rows[0] || null;
  invoice.duplicateResult = duplicateResult.rows[0] || null;

  return invoice;
}

export async function updateInvoice(id: string, updates: Record<string, any>): Promise<any> {
  const keys = Object.keys(updates);
  if (keys.length === 0) return findInvoiceById(id);

  const setClauses = keys.map((key, i) => {
    // Convert camelCase to snake_case
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    return `${snakeKey} = $${i + 2}`;
  });

  const values = keys.map((k) => updates[k]);

  await query(
    `UPDATE invoices SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $1`,
    [id, ...values]
  );

  return findInvoiceById(id);
}

export async function findInvoices(filters: InvoiceFilters): Promise<{ invoices: any[]; total: number }> {
  let countQuery = `SELECT COUNT(*) FROM invoices i LEFT JOIN vendors v ON i.vendor_id = v.id WHERE 1=1`;
  let selectQuery = `
    SELECT i.*, v.company_name as vendor_company_name, v.vendor_code,
           u.first_name || ' ' || u.last_name as uploader_name
    FROM invoices i
    LEFT JOIN vendors v ON i.vendor_id = v.id
    LEFT JOIN users u ON i.uploaded_by = u.id
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.status) {
    countQuery += ` AND i.status = $${paramIndex}`;
    selectQuery += ` AND i.status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }

  if (filters.vendorId) {
    countQuery += ` AND i.vendor_id = $${paramIndex}`;
    selectQuery += ` AND i.vendor_id = $${paramIndex}`;
    params.push(filters.vendorId);
    paramIndex++;
  }

  if (filters.uploadedBy) {
    countQuery += ` AND i.uploaded_by = $${paramIndex}`;
    selectQuery += ` AND i.uploaded_by = $${paramIndex}`;
    params.push(filters.uploadedBy);
    paramIndex++;
  }

  if (filters.startDate) {
    countQuery += ` AND i.invoice_date >= $${paramIndex}`;
    selectQuery += ` AND i.invoice_date >= $${paramIndex}`;
    params.push(filters.startDate);
    paramIndex++;
  }

  if (filters.endDate) {
    countQuery += ` AND i.invoice_date <= $${paramIndex}`;
    selectQuery += ` AND i.invoice_date <= $${paramIndex}`;
    params.push(filters.endDate);
    paramIndex++;
  }

  if (filters.minAmount != null) {
    countQuery += ` AND i.total_amount >= $${paramIndex}`;
    selectQuery += ` AND i.total_amount >= $${paramIndex}`;
    params.push(filters.minAmount);
    paramIndex++;
  }

  if (filters.maxAmount != null) {
    countQuery += ` AND i.total_amount <= $${paramIndex}`;
    selectQuery += ` AND i.total_amount <= $${paramIndex}`;
    params.push(filters.maxAmount);
    paramIndex++;
  }

  if (filters.search) {
    const searchVal = `%${filters.search}%`;
    countQuery += ` AND (i.invoice_number ILIKE $${paramIndex} OR i.vendor_name ILIKE $${paramIndex})`;
    selectQuery += ` AND (i.invoice_number ILIKE $${paramIndex} OR i.vendor_name ILIKE $${paramIndex})`;
    params.push(searchVal);
    paramIndex++;
  }

  // Count total
  const countResult = await query(countQuery, params);
  const total = parseInt(countResult.rows[0].count, 10);

  // Add order by, limit and offset
  selectQuery += ` ORDER BY i.created_at DESC`;

  const offset = (filters.page - 1) * filters.limit;
  selectQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(filters.limit, offset);

  const invoicesResult = await query(selectQuery, params);

  return {
    invoices: invoicesResult.rows,
    total,
  };
}

export async function getDashboardStats(): Promise<any> {
  const totalInvoicesResult = await query(`SELECT COUNT(*) FROM invoices`);
  const statusCountsResult = await query(`SELECT status, COUNT(*), SUM(total_amount) as total_val FROM invoices GROUP BY status`);
  
  const pendingApprovalsResult = await query(
    `SELECT COUNT(*) FROM invoices WHERE status IN ('pending_review', 'ocr_complete', 'duplicate_check', 'fraud_check')`
  );
  
  const totalSpendResult = await query(`SELECT SUM(total_amount) FROM invoices WHERE status = 'approved'`);
  
  const recentInvoicesResult = await query(`
    SELECT i.id, i.invoice_number, i.vendor_name, i.total_amount, i.status, i.created_at
    FROM invoices i
    ORDER BY i.created_at DESC
    LIMIT 5
  `);

  return {
    totalInvoices: parseInt(totalInvoicesResult.rows[0].count || '0', 10),
    statusCounts: statusCountsResult.rows,
    pendingApprovals: parseInt(pendingApprovalsResult.rows[0].count || '0', 10),
    totalSpend: parseFloat(totalSpendResult.rows[0].sum || '0'),
    recentInvoices: recentInvoicesResult.rows,
  };
}

export async function saveLineItems(invoiceId: string, items: any[]): Promise<void> {
  await query(`DELETE FROM invoice_line_items WHERE invoice_id = $1`, [invoiceId]);
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    await createLineItem({
      invoiceId,
      lineNumber: i + 1,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
      taxRate: item.taxRate,
      taxAmount: item.taxAmount,
      productCode: item.productCode,
      category: item.category,
    });
  }
}
