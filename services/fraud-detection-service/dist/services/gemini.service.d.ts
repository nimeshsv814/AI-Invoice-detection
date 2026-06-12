import type { FraudAnalysisResult } from './fraud.service';
export declare function enhanceFraudAnalysis(baseResult: FraudAnalysisResult, ocrData: any): Promise<Pick<FraudAnalysisResult, 'explanation' | 'recommendations'> | null>;
