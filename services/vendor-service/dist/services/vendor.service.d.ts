export declare function getAllVendors(filters: {
    status?: string;
    search?: string;
}): Promise<any[]>;
export declare function getVendor(id: string): Promise<any>;
export declare function createVendor(vendorData: any, userId: string): Promise<any>;
export declare function updateVendor(id: string, data: any): Promise<any>;
export declare function assessVendorRisk(id: string, assessedBy: string, notes?: string): Promise<any>;
