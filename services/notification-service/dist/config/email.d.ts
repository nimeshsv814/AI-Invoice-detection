export declare function sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
}): Promise<boolean>;
export declare function buildEmailHtml(title: string, message: string, priority: string): string;
