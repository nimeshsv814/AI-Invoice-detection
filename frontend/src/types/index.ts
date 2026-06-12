export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  roleName: string;
  department?: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export interface Invoice {
  id: string;
  invoiceNumber?: string;
  vendorId?: string;
  vendorName?: string;
  vendorAddress?: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  fileType?: string;
  status: InvoiceStatus;
  invoiceDate?: string;
  dueDate?: string;
  poNumber?: string;
  subtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
  currency?: string;
  ocrConfidence?: number;
  fraudRiskScore?: number;
  fraudRiskLevel?: 'low' | 'medium' | 'high' | 'critical';
  duplicateRiskScore?: number;
  aiRecommendation?: 'approve' | 'reject' | 'manual_review';
  aiExplanation?: string;
  isDuplicate?: boolean;
  isFraudSuspected?: boolean;
  uploadedBy: string;
  uploaderName?: string;
  createdAt: string;
  updatedAt: string;
  lineItems?: LineItem[];
  ocrResult?: OcrResult;
  fraudResult?: FraudScore;
  duplicateResult?: DuplicateResult;
}

export type InvoiceStatus =
  | 'uploaded'
  | 'processing'
  | 'ocr_complete'
  | 'duplicate_check'
  | 'fraud_check'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'fraud_suspected'
  | 'on_hold';

export interface LineItem {
  id: string;
  invoiceId: string;
  lineNumber: number;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
  productCode?: string;
  category?: string;
}

export interface OcrResult {
  id: string;
  invoiceId: string;
  rawText?: string;
  extractedData: any;
  confidenceScore: number;
  fieldConfidences: Record<string, number>;
  processingTimeMs: number;
  status: 'success' | 'partial' | 'failed';
  processedAt: string;
}

export interface FraudScore {
  id: string;
  invoiceId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  fraudIndicators: string[];
  anomalyDetails: Record<string, any>;
  explanation: string;
  recommendations: string[];
  isConfirmedFraud: boolean;
  analyzedAt: string;
}

export interface DuplicateResult {
  id: string;
  invoiceId: string;
  comparedInvoiceId?: string;
  comparedInvoiceNumber?: string;
  duplicateType?: 'exact' | 'near_duplicate' | 'similar';
  riskScore: number;
  similarityPercentage: number;
  matchingFields: string[];
  isDuplicate: boolean;
  alertRaised: boolean;
  resolutionStatus: 'pending' | 'confirmed_duplicate' | 'false_positive' | 'resolved';
  detectedAt: string;
}

export interface Vendor {
  id: string;
  vendorCode: string;
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  paymentTerms?: number;
  currency?: string;
  category?: string;
  status: 'active' | 'inactive' | 'suspended' | 'under_review';
  riskScore: number;
  trustScore: number;
  totalInvoices: number;
  totalSpend: number;
  avgInvoiceAmount?: number;
  fraudFlags?: number;
  duplicateFlags?: number;
  createdAt: string;
  updatedAt: string;
  riskAssessments?: VendorRiskAssessment[];
}

export interface VendorRiskAssessment {
  id: string;
  vendorId: string;
  riskScore: number;
  trustScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  recommendations: string[];
  assessedAt: string;
  notes?: string;
}

export interface ApprovalWorkflow {
  id: string;
  invoiceId: string;
  currentStep: string;
  status: 'in_progress' | 'pending_review' | 'approved' | 'rejected' | 'on_hold' | 'cancelled';
  aiRecommendation?: 'approve' | 'reject' | 'manual_review';
  aiConfidence?: number;
  aiExplanation?: string;
  assignedTo?: string;
  assigneeName?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  history?: ApprovalHistory[];
  // invoice details (from join)
  invoiceNumber?: string;
  vendorName?: string;
  totalAmount?: number;
  currency?: string;
}

export interface ApprovalHistory {
  id: string;
  workflowId: string;
  invoiceId: string;
  step: string;
  action: string;
  performedBy?: string;
  performerName?: string;
  comments?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  channel: 'in_app' | 'email' | 'both';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
  referenceId?: string;
  referenceType?: string;
  emailSent?: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface DashboardKPIs {
  invoiceTotals: {
    total_invoices: number;
    approved: number;
    pending: number;
    fraud_suspected: number;
    rejected: number;
    total_approved_spend: number;
    total_pending_spend: number;
    avg_invoice_amount: number;
    avg_ocr_confidence: number;
  };
  fraudStats: {
    total_analyzed: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    avg_risk_score: number;
  };
  vendorStats: {
    total_vendors: number;
    active: number;
    under_review: number;
    high_risk_vendors: number;
    total_vendor_spend: number;
  };
  approvalStats: {
    total_workflows: number;
    approved: number;
    rejected: number;
    pending: number;
  };
  monthlySpend: Array<{ month: string; invoice_count: number; total_spend: number; avg_amount: number }>;
  topVendors: Array<{ vendor_name: string; invoice_count: number; total_spend: number; max_fraud_score: number }>;
  recentActivity: Invoice[];
}
