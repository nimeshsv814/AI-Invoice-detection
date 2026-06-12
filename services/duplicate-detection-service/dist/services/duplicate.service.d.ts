export interface DuplicateCheckInput {
    invoiceId: string;
    invoiceNumber?: string;
    vendorName?: string;
    totalAmount?: number;
    invoiceDate?: string;
    poNumber?: string;
}
export interface DuplicateCheckResult {
    invoiceId: string;
    isDuplicate: boolean;
    duplicateType?: 'exact' | 'near_duplicate' | 'similar';
    riskScore: number;
    similarityPercentage: number;
    matchedInvoiceId?: string;
    matchingFields: string[];
    fieldScores: Record<string, number>;
    alertRaised: boolean;
}
export declare function checkForDuplicates(input: DuplicateCheckInput): Promise<DuplicateCheckResult>;
export declare function getDuplicateAlerts(): Promise<any[]>;
export declare function resolveDuplicate(id: string, status: 'confirmed_duplicate' | 'false_positive', resolvedBy: string, notes?: string): Promise<void>;
