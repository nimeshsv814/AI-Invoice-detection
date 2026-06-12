export declare function getDashboardKPIs(): Promise<any>;
export declare function getSpendAnalytics(period?: string): Promise<any>;
export declare function getFraudAnalytics(): Promise<any>;
export declare function getAuditLogs(filters: {
    entityType?: string;
    userId?: string;
    action?: string;
    page?: number;
    limit?: number;
}): Promise<any>;
