export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}
export declare function verifyAccessToken(token: string): TokenPayload;
