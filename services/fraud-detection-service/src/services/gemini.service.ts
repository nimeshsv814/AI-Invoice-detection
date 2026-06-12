import { GoogleGenAI } from '@google/genai';
import logger from '../utils/logger';
import type { FraudAnalysisResult } from './fraud.service';

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const enabled = (process.env.GEMINI_ENABLED || 'false').toLowerCase() === 'true';

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  if (!enabled || !apiKey) return null;
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

export async function enhanceFraudAnalysis(
  baseResult: FraudAnalysisResult,
  ocrData: any
): Promise<Pick<FraudAnalysisResult, 'explanation' | 'recommendations'> | null> {
  const gemini = getClient();
  if (!gemini) return null;

  try {
    const response = await gemini.models.generateContent({
      model,
      contents: [
        'You are an invoice fraud analysis assistant for an accounts payable platform.',
        'Do not change the numeric risk score, risk level, or decision recommendation.',
        'Return only compact JSON with keys "explanation" and "recommendations".',
        '"recommendations" must be an array of 1 to 5 short operational actions.',
        JSON.stringify({
          invoice: {
            invoiceNumber: ocrData.invoiceNumber,
            vendorName: ocrData.vendorName,
            invoiceDate: ocrData.invoiceDate,
            dueDate: ocrData.dueDate,
            poNumber: ocrData.poNumber,
            subtotal: ocrData.subtotal,
            taxAmount: ocrData.taxAmount,
            totalAmount: ocrData.totalAmount,
            currency: ocrData.currency,
            confidence: ocrData.confidence,
          },
          ruleBasedResult: baseResult,
        }),
      ].join('\n\n'),
    });

    const parsed = JSON.parse(stripJsonFence(response.text || '{}'));
    if (typeof parsed.explanation !== 'string' || !Array.isArray(parsed.recommendations)) {
      return null;
    }

    return {
      explanation: parsed.explanation,
      recommendations: parsed.recommendations
        .filter((item: unknown): item is string => typeof item === 'string')
        .slice(0, 5),
    };
  } catch (error) {
    logger.warn('Gemini fraud analysis enhancement failed. Using rule-based explanation.', error);
    return null;
  }
}

function stripJsonFence(value: string): string {
  return value
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
}
