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
export declare function createInvoice(invoice: {
    id?: string;
    fileName: string;
    filePath: string;
    fileSize?: number;
    fileType?: string;
    status: string;
    uploadedBy: string;
}): Promise<any>;
export declare function createLineItem(item: {
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
}): Promise<any>;
export declare function findInvoiceById(id: string): Promise<any>;
export declare function updateInvoice(id: string, updates: Record<string, any>): Promise<any>;
export declare function findInvoices(filters: InvoiceFilters): Promise<{
    invoices: any[];
    total: number;
}>;
export declare function getDashboardStats(): Promise<any>;
export declare function saveLineItems(invoiceId: string, items: any[]): Promise<void>;
