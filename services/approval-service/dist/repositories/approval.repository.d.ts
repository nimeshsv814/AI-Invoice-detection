export declare function createWorkflow(workflow: {
    invoiceId: string;
    currentStep?: string;
    status?: string;
    aiRecommendation?: string;
    aiConfidence?: number;
    aiExplanation?: string;
    assignedTo?: string;
    priority?: string;
}): Promise<any>;
export declare function createHistoryEntry(entry: {
    workflowId: string;
    invoiceId: string;
    step: string;
    action: string;
    performedBy?: string;
    performerName?: string;
    comments?: string;
    metadata?: any;
}): Promise<any>;
export declare function findWorkflowByInvoiceId(invoiceId: string): Promise<any>;
export declare function findWorkflowById(id: string): Promise<any>;
export declare function updateWorkflow(id: string, updates: Record<string, any>): Promise<any>;
export declare function findApprovalQueue(filters: {
    assignedTo?: string;
    status?: string;
    priority?: string;
}): Promise<any[]>;
