-- ============================================================
-- Seed Data for AI Invoice Processing Platform
-- ============================================================

-- ─────────────────────────────────────────────
-- ROLES
-- ─────────────────────────────────────────────
INSERT INTO roles (id, name, description, permissions) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin',            'Full system access',                        '["*"]'),
  ('00000000-0000-0000-0000-000000000002', 'finance_analyst',  'Process and review invoices',               '["invoices:read","invoices:create","ocr:read","fraud:read","duplicate:read"]'),
  ('00000000-0000-0000-0000-000000000003', 'finance_manager',  'Approve/reject invoices and manage team',   '["invoices:*","approvals:*","analytics:read","vendors:read"]'),
  ('00000000-0000-0000-0000-000000000004', 'vendor_manager',   'Manage vendor relationships',               '["vendors:*","invoices:read","analytics:read"]'),
  ('00000000-0000-0000-0000-000000000005', 'auditor',          'Read-only access for audit and compliance', '["invoices:read","audit:read","analytics:read","fraud:read"]')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- USERS (passwords are hashed 'Admin@1234')
-- bcrypt hash of 'Admin@1234' with 10 rounds
-- ─────────────────────────────────────────────
INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, department, is_active, is_email_verified) VALUES
  ('10000000-0000-0000-0000-000000000001', 'admin@invoiceai.com',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System',   'Admin',    '00000000-0000-0000-0000-000000000001', 'IT',       true, true),
  ('10000000-0000-0000-0000-000000000002', 'analyst@invoiceai.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sarah',    'Johnson',  '00000000-0000-0000-0000-000000000002', 'Finance',  true, true),
  ('10000000-0000-0000-0000-000000000003', 'manager@invoiceai.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Michael',  'Chen',     '00000000-0000-0000-0000-000000000003', 'Finance',  true, true),
  ('10000000-0000-0000-0000-000000000004', 'vendor@invoiceai.com',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Emily',    'Rodriguez','00000000-0000-0000-0000-000000000004', 'Procurement', true, true),
  ('10000000-0000-0000-0000-000000000005', 'auditor@invoiceai.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'James',    'Williams', '00000000-0000-0000-0000-000000000005', 'Audit',    true, true)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- VENDORS
-- ─────────────────────────────────────────────
INSERT INTO vendors (id, vendor_code, company_name, contact_name, email, phone, address_line1, city, state, postal_code, country, tax_id, payment_terms, currency, category, status, risk_score, trust_score, total_invoices, total_spend, created_by) VALUES
  ('20000000-0000-0000-0000-000000000001', 'VND-001', 'Acme Technologies Inc.',       'John Smith',    'billing@acmetech.com',      '555-0101', '123 Innovation Blvd', 'San Francisco', 'CA', '94102', 'US', '12-3456789', 30, 'USD', 'Technology',    'active', 12.5, 87.5, 45,  285000.00, '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', 'VND-002', 'Global Office Supplies Co.',   'Lisa Park',     'ap@globaloffice.com',       '555-0102', '456 Commerce Street',  'New York',      'NY', '10001', 'US', '23-4567890', 45, 'USD', 'Office Supplies','active', 8.0,  92.0, 120, 75000.00,  '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000003', 'VND-003', 'Premium Consulting Group',     'David Lee',     'invoices@premiumcg.com',    '555-0103', '789 Executive Park',   'Chicago',       'IL', '60601', 'US', '34-5678901', 15, 'USD', 'Consulting',    'active', 22.3, 77.7, 28,  890000.00, '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000004', 'VND-004', 'FastLogistics Partners',       'Maria Garcia',  'finance@fastlogistics.com', '555-0104', '321 Transport Ave',    'Dallas',        'TX', '75201', 'US', '45-6789012', 30, 'USD', 'Logistics',     'active', 15.8, 84.2, 67,  198000.00, '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000005', 'VND-005', 'CloudSoft Solutions',          'Robert Wilson', 'billing@cloudsoft.io',      '555-0105', '654 Cloud Street',     'Seattle',       'WA', '98101', 'US', '56-7890123', 30, 'USD', 'Software',      'active', 5.2,  94.8, 89,  423000.00, '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000006', 'VND-006', 'Suspicious Supplies LLC',      'Unknown Person','contact@suspiciousco.biz',  '555-0106', '999 Unknown Street',   'Unknown City',  'XX', '00000', 'US', '99-9999999', 0,  'USD', 'Unknown',       'under_review', 78.5, 21.5, 5, 45000.00, '10000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- SAMPLE INVOICES
-- ─────────────────────────────────────────────
INSERT INTO invoices (id, invoice_number, vendor_id, vendor_name, file_name, file_path, file_size, file_type, status, invoice_date, due_date, po_number, subtotal, tax_amount, total_amount, currency, ocr_confidence, fraud_risk_score, fraud_risk_level, duplicate_risk_score, ai_recommendation, uploaded_by) VALUES
  ('30000000-0000-0000-0000-000000000001', 'INV-2024-001', '20000000-0000-0000-0000-000000000001', 'Acme Technologies Inc.',    'invoice_001.pdf', '/uploads/invoice_001.pdf', 245678, 'application/pdf', 'approved',         '2024-01-15', '2024-02-14', 'PO-2024-001', 10000.00, 1000.00, 11000.00, 'USD', 97.5, 8.2,  'low',    5.0,  'approve',        '10000000-0000-0000-0000-000000000002'),
  ('30000000-0000-0000-0000-000000000002', 'INV-2024-002', '20000000-0000-0000-0000-000000000002', 'Global Office Supplies',    'invoice_002.pdf', '/uploads/invoice_002.pdf', 189432, 'application/pdf', 'pending_review',   '2024-01-18', '2024-03-04', 'PO-2024-002', 2500.00,  250.00,  2750.00,  'USD', 95.1, 12.5, 'low',    8.0,  'approve',        '10000000-0000-0000-0000-000000000002'),
  ('30000000-0000-0000-0000-000000000003', 'INV-2024-003', '20000000-0000-0000-0000-000000000003', 'Premium Consulting Group',  'invoice_003.pdf', '/uploads/invoice_003.pdf', 312890, 'application/pdf', 'fraud_suspected',  '2024-01-20', '2024-02-04', 'PO-2024-003', 75000.00, 7500.00, 82500.00, 'USD', 88.3, 78.9, 'high',   15.0, 'reject',         '10000000-0000-0000-0000-000000000002'),
  ('30000000-0000-0000-0000-000000000004', 'INV-2024-004', '20000000-0000-0000-0000-000000000004', 'FastLogistics Partners',    'invoice_004.pdf', '/uploads/invoice_004.pdf', 198765, 'application/pdf', 'approved',         '2024-01-22', '2024-02-21', 'PO-2024-004', 8900.00,  890.00,  9790.00,  'USD', 99.2, 5.1,  'low',    2.0,  'approve',        '10000000-0000-0000-0000-000000000002'),
  ('30000000-0000-0000-0000-000000000005', 'INV-2024-005', '20000000-0000-0000-0000-000000000005', 'CloudSoft Solutions',       'invoice_005.pdf', '/uploads/invoice_005.pdf', 267345, 'application/pdf', 'pending_review',   '2024-01-25', '2024-02-24', 'PO-2024-005', 45000.00, 4500.00, 49500.00, 'USD', 96.7, 9.8,  'low',    3.0,  'approve',        '10000000-0000-0000-0000-000000000002'),
  ('30000000-0000-0000-0000-000000000006', 'INV-2024-006', '20000000-0000-0000-0000-000000000006', 'Suspicious Supplies LLC',   'invoice_006.pdf', '/uploads/invoice_006.pdf', 145231, 'application/pdf', 'fraud_suspected',  '2024-01-28', '2024-01-28', NULL,          50000.00, 0.00,    50000.00, 'USD', 72.1, 95.3, 'critical',45.0, 'reject',         '10000000-0000-0000-0000-000000000002'),
  ('30000000-0000-0000-0000-000000000007', 'INV-2024-001', '20000000-0000-0000-0000-000000000001', 'Acme Technologies Inc.',    'invoice_007.pdf', '/uploads/invoice_007.pdf', 244100, 'application/pdf', 'rejected',         '2024-01-15', '2024-02-14', 'PO-2024-001', 10000.00, 1000.00, 11000.00, 'USD', 98.1, 35.0, 'medium', 95.0, 'reject',         '10000000-0000-0000-0000-000000000002'),
  ('30000000-0000-0000-0000-000000000008', 'INV-2024-007', '20000000-0000-0000-0000-000000000001', 'Acme Technologies Inc.',    'invoice_008.pdf', '/uploads/invoice_008.pdf', 198000, 'application/pdf', 'approved',         '2024-02-01', '2024-03-02', 'PO-2024-006', 22000.00, 2200.00, 24200.00, 'USD', 98.5, 6.0,  'low',    2.0,  'approve',        '10000000-0000-0000-0000-000000000002'),
  ('30000000-0000-0000-0000-000000000009', 'INV-2024-008', '20000000-0000-0000-0000-000000000003', 'Premium Consulting Group',  'invoice_009.pdf', '/uploads/invoice_009.pdf', 310000, 'application/pdf', 'pending_review',   '2024-02-05', '2024-02-20', 'PO-2024-007', 35000.00, 3500.00, 38500.00, 'USD', 91.0, 42.1, 'medium', 10.0, 'manual_review',  '10000000-0000-0000-0000-000000000002'),
  ('30000000-0000-0000-0000-000000000010', 'INV-2024-009', '20000000-0000-0000-0000-000000000005', 'CloudSoft Solutions',       'invoice_010.pdf', '/uploads/invoice_010.pdf', 265000, 'application/pdf', 'processing',       '2024-02-10', '2024-03-11', 'PO-2024-008', 18000.00, 1800.00, 19800.00, 'USD', NULL, NULL, NULL,     NULL, NULL,             '10000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- FRAUD SCORES
-- ─────────────────────────────────────────────
INSERT INTO fraud_scores (invoice_id, risk_score, risk_level, fraud_indicators, explanation, recommendations) VALUES
  ('30000000-0000-0000-0000-000000000001', 8.2,  'low',      '[]',                                                                                      'Invoice appears legitimate with consistent vendor history and normal amount range.',     '["Approve for payment"]'),
  ('30000000-0000-0000-0000-000000000003', 78.9, 'high',     '["unusual_amount","frequency_anomaly","new_bank_details"]',                               'Invoice amount is 340% above vendor average. Bank details changed 3 days before submission.', '["Hold for manual review","Verify bank account change","Contact vendor directly"]'),
  ('30000000-0000-0000-0000-000000000006', 95.3, 'critical', '["unknown_vendor","no_po_number","zero_tax","round_amount","new_vendor_high_value"]',    'Multiple critical fraud indicators: no PO, zero tax on $50k, vendor registered 8 days ago.',  '["Immediately freeze invoice","Escalate to Finance Manager","File fraud report","Block vendor"]')
ON CONFLICT (invoice_id) DO NOTHING;

-- ─────────────────────────────────────────────
-- DUPLICATE DETECTION RESULTS
-- ─────────────────────────────────────────────
INSERT INTO duplicate_detection_results (invoice_id, compared_invoice_id, duplicate_type, risk_score, similarity_percentage, matching_fields, is_duplicate, alert_raised) VALUES
  ('30000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000001', 'exact', 95.0, 99.8, '["invoice_number","vendor_id","total_amount","invoice_date","po_number"]', true, true)
ON CONFLICT (invoice_id) DO NOTHING;

-- ─────────────────────────────────────────────
-- APPROVAL WORKFLOWS
-- ─────────────────────────────────────────────
INSERT INTO approval_workflows (id, invoice_id, current_step, status, ai_recommendation, ai_confidence, ai_explanation, assigned_to, priority) VALUES
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'completed',      'approved',      'approve',        97.5, 'Low risk invoice from trusted vendor with consistent history.',          '10000000-0000-0000-0000-000000000003', 'normal'),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'manager_review', 'pending_review','approve',        85.0, 'Invoice within normal parameters. Minor discrepancy in line items.',      '10000000-0000-0000-0000-000000000003', 'normal'),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'fraud_check',    'on_hold',       'reject',         91.0, 'High fraud risk detected. Unusual amount and recent bank detail change.', '10000000-0000-0000-0000-000000000003', 'urgent'),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000006', 'fraud_check',    'on_hold',       'reject',         99.0, 'Critical fraud risk. Multiple fraud indicators detected.',                '10000000-0000-0000-0000-000000000003', 'urgent')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────
INSERT INTO notifications (user_id, type, title, message, channel, priority, is_read, reference_id, reference_type) VALUES
  ('10000000-0000-0000-0000-000000000003', 'approval_required',    'Invoice Pending Approval',       'Invoice INV-2024-002 from Global Office Supplies requires your review.',         'in_app', 'normal', false, '30000000-0000-0000-0000-000000000002', 'invoice'),
  ('10000000-0000-0000-0000-000000000003', 'fraud_detected',       'CRITICAL: Fraud Alert',          'Invoice INV-2024-006 from Suspicious Supplies LLC has a 95.3% fraud risk score.', 'both',   'urgent', false, '30000000-0000-0000-0000-000000000006', 'invoice'),
  ('10000000-0000-0000-0000-000000000002', 'duplicate_detected',   'Duplicate Invoice Detected',     'Invoice INV-2024-001 appears to be a duplicate of a previously approved invoice.',  'in_app', 'high',   false, '30000000-0000-0000-0000-000000000007', 'invoice'),
  ('10000000-0000-0000-0000-000000000002', 'invoice_approved',     'Invoice Approved',               'Invoice INV-2024-001 from Acme Technologies has been approved for payment.',       'in_app', 'normal', true,  '30000000-0000-0000-0000-000000000001', 'invoice'),
  ('10000000-0000-0000-0000-000000000003', 'approval_required',    'High-Risk Invoice Review',       'Invoice INV-2024-008 requires manual review due to elevated risk score.',          'both',   'high',   false, '30000000-0000-0000-0000-000000000009', 'invoice')
ON CONFLICT (id) DO NOTHING;
