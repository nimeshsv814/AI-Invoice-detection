import { Pool, PoolClient } from 'pg';
export declare function getPool(): Pool;
export declare function connectDatabase(): Promise<void>;
export declare function query<T = any>(text: string, params?: any[]): Promise<{
    rows: T[];
    rowCount: number | null;
}>;
export declare function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>;
