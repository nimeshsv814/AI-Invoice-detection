export declare function findVendors(filters: {
    status?: string;
    search?: string;
}): Promise<any[]>;
export declare function findVendorById(id: string): Promise<any>;
export declare function findVendorByCode(code: string): Promise<any>;
export declare function createVendor(vendor: {
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
}): Promise<any>;
export declare function updateVendor(id: string, updates: Record<string, any>): Promise<any>;
export declare function createRiskAssessment(assessment: {
    vendorId: string;
    riskScore: number;
    trustScore: number;
    riskLevel: string;
    riskFactors: string[];
    recommendations: string[];
    assessedBy: string;
    notes?: string;
}): Promise<any>;
