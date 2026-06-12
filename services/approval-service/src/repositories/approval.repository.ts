import { query } from '../config/database';

export async function createWorkflow(workflow: {
  invoiceId: string;
  currentStep?: string;
  status?: string;
  aiRecommendation?: string;
  aiConfidence?: number;
  aiExplanation?: string;
  assignedTo?: string;
  priority?: string;
}): Promise<any> {
  const result = await query(
    `INSERT INTO approval_workflows 
       (invoice_id, current_step, status, ai_recommendation, ai_confidence, ai_explanation, assigned_to, priority)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      workflow.invoiceId,
      workflow.currentStep || 'ocr_processing',
      workflow.status || 'in_progress',
      workflow.aiRecommendation || null,
      workflow.aiConfidence || null,
      workflow.aiExplanation || null,
      workflow.assignedTo || null,
      workflow.priority || 'normal',
    ]
  );
  return result.rows[0];
}

export async function createHistoryEntry(entry: {
  workflowId: string;
  invoiceId: string;
  step: string;
  action: string;
  performedBy?: string;
  performerName?: string;
  comments?: string;
  metadata?: any;
}): Promise<any> {
  const result = await query(
    `INSERT INTO approval_history 
       (workflow_id, invoice_id, step, action, performed_by, performer_name, comments, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      entry.workflowId,
      entry.invoiceId,
      entry.step,
      entry.action,
      entry.performedBy || null,
      entry.performerName || null,
      entry.comments || null,
      entry.metadata ? JSON.stringify(entry.metadata) : null,
    ]
  );
  return result.rows[0];
}

export async function findWorkflowByInvoiceId(invoiceId: string): Promise<any> {
  const workflowResult = await query(
    `SELECT w.*, u.first_name || ' ' || u.last_name as assignee_name
     FROM approval_workflows w
     LEFT JOIN users u ON w.assigned_to = u.id
     WHERE w.invoice_id = $1 LIMIT 1`,
    [invoiceId]
  );
  if (workflowResult.rowCount === 0) return null;
  const workflow = workflowResult.rows[0];

  const historyResult = await query(
    `SELECT * FROM approval_history WHERE workflow_id = $1 ORDER BY created_at ASC`,
    [workflow.id]
  );
  workflow.history = historyResult.rows;
  return workflow;
}

export async function findWorkflowById(id: string): Promise<any> {
  const result = await query(
    `SELECT * FROM approval_workflows WHERE id = $1 LIMIT 1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function updateWorkflow(id: string, updates: Record<string, any>): Promise<any> {
  const keys = Object.keys(updates);
  if (keys.length === 0) return findWorkflowById(id);

  const setClauses = keys.map((key, i) => {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    return `${snakeKey} = $${i + 2}`;
  });

  const values = keys.map((k) => updates[k]);

  const result = await query(
    `UPDATE approval_workflows SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, ...values]
  );

  return result.rows[0];
}

export async function findApprovalQueue(filters: {
  assignedTo?: string;
  status?: string;
  priority?: string;
}): Promise<any[]> {
  let selectQuery = `
    SELECT w.*, i.invoice_number, i.vendor_name, i.total_amount, i.currency, i.invoice_date,
           u.first_name || ' ' || u.last_name as assignee_name
    FROM approval_workflows w
    JOIN invoices i ON w.invoice_id = i.id
    LEFT JOIN users u ON w.assigned_to = u.id
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.assignedTo) {
    selectQuery += ` AND w.assigned_to = $${paramIndex}`;
    params.push(filters.assignedTo);
    paramIndex++;
  }

  if (filters.status) {
    selectQuery += ` AND w.status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  } else {
    // default return in_progress and pending_review
    selectQuery += ` AND w.status IN ('in_progress', 'pending_review')`;
  }

  if (filters.priority) {
    selectQuery += ` AND w.priority = $${paramIndex}`;
    params.push(filters.priority);
    paramIndex++;
  }

  selectQuery += ` ORDER BY CASE w.priority
      WHEN 'urgent' THEN 1
      WHEN 'high' THEN 2
      WHEN 'normal' THEN 3
      WHEN 'low' THEN 4
      ELSE 5
    END, w.created_at ASC`;

  const result = await query(selectQuery, params);
  return result.rows;
}
