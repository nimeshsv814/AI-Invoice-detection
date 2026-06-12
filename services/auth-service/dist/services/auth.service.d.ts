import { User } from '../models/user.model';
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export interface AuthResponse {
    user: Omit<User, 'passwordHash' | 'refreshTokenHash'>;
    tokens: AuthTokens;
}
export declare function register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roleName: string;
    department?: string;
    phone?: string;
    avatarUrl?: string;
}): Promise<AuthResponse>;
export declare function login(email: string, password: string): Promise<AuthResponse>;
export declare function refresh(token: string): Promise<AuthTokens>;
export declare function logout(userId: string): Promise<void>;
export declare function getUserProfile(userId: string): Promise<Omit<User, 'passwordHash' | 'refreshTokenHash'>>;
