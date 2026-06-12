-- ============================================================
-- AI-Powered Invoice Processing & Fraud Detection Platform
-- PostgreSQL Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─────────────────────────────────────────────
-- ROLES & USERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(id),
    department VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    refresh_token_hash VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- VENDORS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_code VARCHAR(50) NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(150),
    email VARCHAR(255),
    phone VARCHAR(20),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'US',
    tax_id VARCHAR(50),
    bank_account_last4 VARCHAR(4),
    payment_terms INTEGER DEFAULT 30,
    currency VARCHAR(10) DEFAULT 'USD',
    category VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','suspended','under_review')),
    risk_score DECIMAL(5,2) DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    trust_score DECIMAL(5,2) DEFAULT 100 CHECK (trust_score >= 0 AND trust_score <= 100),
    total_invoices INTEGER DEFAULT 0,
    total_spend DECIMAL(15,2) DEFAULT 0,
    avg_invoice_amount DECIMAL(15,2) DEFAULT 0,
    fraud_flags INTEGER DEFAULT 0,
    duplicate_flags INTEGER DEFAULT 0,
    last_invoice_date TIMESTAMPTZ,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendor_risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    risk_score DECIMAL(5,2) NOT NULL,
    trust_score DECIMAL(5,2) NOT NULL,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low','medium','high','critical')),
    risk_factors JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    assessed_by UUID REFERENCES users(id),
    assessed_at TIMESTAMPTZ DEFAULT NOW(),
    next_review_date TIMESTAMPTZ,
    notes TEXT
);

-- ─────────────────────────────────────────────
-- INVOICES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(100),
    vendor_id UUID REFERENCES vendors(id),
    vendor_name VARCHAR(255),
    vendor_address TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(50),
    status VARCHAR(30) DEFAULT 'uploaded' CHECK (status IN (
        'uploaded','processing','ocr_complete','duplicate_check','fraud_check',
        'pending_review','approved','rejected','fraud_suspected','on_hold'
    )),
    invoice_date DATE,
    due_date DATE,
    po_number VARCHAR(100),
    subtotal DECIMAL(15,2),
    tax_amount DECIMAL(15,2),
    total_amount DECIMAL(15,2),
    currency VARCHAR(10) DEFAULT 'USD',
    payment_terms INTEGER,
    description TEXT,
    ocr_confidence DECIMAL(5,2),
    ocr_data JSONB,
    fraud_risk_score DECIMAL(5,2),
    fraud_risk_level VARCHAR(20),
    duplicate_risk_score DECIMAL(5,2),
    ai_recommendation VARCHAR(30) CHECK (ai_recommendation IN ('approve','reject','manual_review')),
    ai_explanation TEXT,
    is_duplicate BOOLEAN DEFAULT FALSE,
    is_fraud_suspected BOOLEAN DEFAULT FALSE,
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10,4) DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    unit_of_measure VARCHAR(50),
    amount DECIMAL(15,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    po_line_number VARCHAR(50),
    product_code VARCHAR(100),
    category VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- OCR RESULTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ocr_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    raw_text TEXT,
    extracted_data JSONB NOT NULL DEFAULT '{}',
    confidence_score DECIMAL(5,2),
    field_confidences JSONB DEFAULT '{}',
    processing_time_ms INTEGER,
    engine_version VARCHAR(50),
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success','partial','failed')),
    error_message TEXT,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- DUPLICATE DETECTION
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS duplicate_detection_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL UNIQUE REFERENCES invoices(id) ON DELETE CASCADE,
    compared_invoice_id UUID REFERENCES invoices(id),
    duplicate_type VARCHAR(30) CHECK (duplicate_type IN ('exact','near_duplicate','similar')),
    risk_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    similarity_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    matching_fields JSONB DEFAULT '[]',
    field_scores JSONB DEFAULT '{}',
    is_duplicate BOOLEAN DEFAULT FALSE,
    alert_raised BOOLEAN DEFAULT FALSE,
    resolution_status VARCHAR(20) DEFAULT 'pending' CHECK (resolution_status IN ('pending','confirmed_duplicate','false_positive','resolved')),
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    notes TEXT,
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- FRAUD DETECTION
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fraud_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL UNIQUE REFERENCES invoices(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id),
    risk_score DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level VARCHAR(20) NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low','medium','high','critical')),
    fraud_indicators JSONB DEFAULT '[]',
    anomaly_details JSONB DEFAULT '{}',
    explanation TEXT,
    recommendations JSONB DEFAULT '[]',
    model_version VARCHAR(50),
    processing_time_ms INTEGER,
    is_confirmed_fraud BOOLEAN DEFAULT FALSE,
    confirmed_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMPTZ,
    analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- APPROVAL WORKFLOWS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS approval_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    current_step VARCHAR(50) NOT NULL DEFAULT 'ocr_processing',
    status VARCHAR(30) NOT NULL DEFAULT 'in_progress' CHECK (status IN (
        'in_progress','pending_review','approved','rejected','on_hold','cancelled'
    )),
    ai_recommendation VARCHAR(30) CHECK (ai_recommendation IN ('approve','reject','manual_review')),
    ai_confidence DECIMAL(5,2),
    ai_explanation TEXT,
    assigned_to UUID REFERENCES users(id),
    escalated_to UUID REFERENCES users(id),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    sla_breached BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approval_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    step VARCHAR(50) NOT NULL,
    action VARCHAR(30) NOT NULL CHECK (action IN (
        'submitted','ocr_completed','duplicate_checked','fraud_checked',
        'ai_recommended','assigned','approved','rejected','on_hold',
        'escalated','commented','returned','cancelled'
    )),
    performed_by UUID REFERENCES users(id),
    performer_name VARCHAR(200),
    comments TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    channel VARCHAR(20) DEFAULT 'in_app' CHECK (channel IN ('in_app','email','both')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    action_url TEXT,
    reference_id UUID,
    reference_type VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- AUDIT LOGS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    service_name VARCHAR(50),
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success','failure','partial')),
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ANALYTICS CACHE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_type VARCHAR(50) NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_risk_score ON vendors(risk_score);
CREATE INDEX IF NOT EXISTS idx_vendors_company_name_trgm ON vendors USING gin(company_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_id ON invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_uploaded_by ON invoices(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_total_amount ON invoices(total_amount);
CREATE INDEX IF NOT EXISTS idx_invoices_fraud_risk_level ON invoices(fraud_risk_level);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_name_trgm ON invoices USING gin(vendor_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_ocr_results_invoice_id ON ocr_results(invoice_id);

CREATE INDEX IF NOT EXISTS idx_duplicate_results_invoice_id ON duplicate_detection_results(invoice_id);
CREATE INDEX IF NOT EXISTS idx_duplicate_results_is_duplicate ON duplicate_detection_results(is_duplicate);

CREATE INDEX IF NOT EXISTS idx_fraud_scores_invoice_id ON fraud_scores(invoice_id);
CREATE INDEX IF NOT EXISTS idx_fraud_scores_risk_level ON fraud_scores(risk_level);
CREATE INDEX IF NOT EXISTS idx_fraud_scores_vendor_id ON fraud_scores(vendor_id);

CREATE INDEX IF NOT EXISTS idx_approval_workflows_invoice_id ON approval_workflows(invoice_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_status ON approval_workflows(status);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_assigned_to ON approval_workflows(assigned_to);

CREATE INDEX IF NOT EXISTS idx_approval_history_workflow_id ON approval_history(workflow_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_invoice_id ON approval_history(invoice_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_type ON analytics_snapshots(snapshot_type);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_period ON analytics_snapshots(period_start, period_end);
