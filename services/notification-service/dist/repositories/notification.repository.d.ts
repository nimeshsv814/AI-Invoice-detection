export declare function createNotification(notification: {
    userId: string;
    type: string;
    title: string;
    message: string;
    channel?: string;
    priority?: string;
    actionUrl?: string;
    referenceId?: string;
    referenceType?: string;
    metadata?: any;
}): Promise<any>;
export declare function findNotificationsByUser(userId: string, filters: {
    isRead?: boolean;
    type?: string;
    limit?: number;
    offset?: number;
}): Promise<{
    notifications: any[];
    total: number;
}>;
export declare function markAsRead(id: string, userId: string): Promise<any>;
export declare function markAllAsRead(userId: string): Promise<number>;
export declare function getUnreadCount(userId: string): Promise<number>;
