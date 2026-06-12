export interface OcrExtractedData {
    invoiceNumber?: string;
    vendorName?: string;
    vendorAddress?: string;
    invoiceDate?: string;
    dueDate?: string;
    poNumber?: string;
    subtotal?: number;
    taxAmount?: number;
    totalAmount?: number;
    currency?: string;
    lineItems?: LineItem[];
    confidence: number;
    fieldConfidences: Record<string, number>;
}
export interface LineItem {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    taxRate?: number;
    taxAmount?: number;
    productCode?: string;
    category?: string;
}
export declare function extractInvoiceData(invoiceId: string, filePath: string): Promise<OcrExtractedData>;
export declare function getOcrResult(invoiceId: string): Promise<any>;
