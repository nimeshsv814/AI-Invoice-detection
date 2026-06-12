import * as invoiceRepo from '../repositories/invoice.repository';
export declare function uploadInvoice(file: Express.Multer.File, userId: string, userEmail: string): Promise<any>;
export declare function getInvoices(filters: invoiceRepo.InvoiceFilters): Promise<{
    invoices: any[];
    total: number;
}>;
export declare function getInvoiceById(id: string): Promise<any>;
export declare function getDashboardStats(): Promise<any>;
export declare function updateInvoiceStatus(id: string, status: string, comments?: string): Promise<any>;
