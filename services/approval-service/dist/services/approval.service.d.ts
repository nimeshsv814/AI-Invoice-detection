export declare function startWorkflow(workflowInfo: {
    invoiceId: string;
    aiRecommendation?: string;
    aiConfidence?: number;
    aiExplanation?: string;
    priority?: string;
}): Promise<any>;
export declare function getWorkflow(invoiceId: string): Promise<any>;
export declare function recordAction(actionInfo: {
    invoiceId: string;
    action: 'approved' | 'rejected' | 'commented' | 'escalated' | 'on_hold';
    performedBy?: string;
    performerName?: string;
    comments?: string;
    escalatedTo?: string;
}): Promise<any>;
export declare function getQueue(filters: {
    assignedTo?: string;
    status?: string;
    priority?: string;
}): Promise<any[]>;
