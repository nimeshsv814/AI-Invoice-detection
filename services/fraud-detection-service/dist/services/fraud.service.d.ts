export interface FraudAnalysisResult {
    invoiceId: string;
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    fraudIndicators: string[];
    anomalyDetails: Record<string, any>;
    explanation: string;
    recommendations: string[];
    recommendation: 'approve' | 'reject' | 'manual_review';
    confidence: number;
}
export declare function analyzeInvoice(invoiceId: string, ocrData: any): Promise<FraudAnalysisResult>;
export declare function getFraudScore(invoiceId: string): Promise<any>;
export declare function getFraudTrends(): Promise<any>;
export declare function getHighRiskVendors(): Promise<any>;
