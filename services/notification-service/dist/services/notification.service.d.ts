export declare function createNotification(data: {
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
export declare function getNotifications(userId: string, options: {
    page?: number;
    limit?: number;
    isRead?: string;
    type?: string;
}): Promise<{
    notifications: any[];
    total: number;
    unreadCount: number;
    page: number;
    limit: number;
}>;
export declare function markRead(notificationId: string, userId: string): Promise<any>;
export declare function markAllRead(userId: string): Promise<{
    markedRead: number;
}>;
