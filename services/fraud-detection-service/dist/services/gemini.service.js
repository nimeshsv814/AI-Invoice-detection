"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enhanceFraudAnalysis = enhanceFraudAnalysis;
const genai_1 = require("@google/genai");
const logger_1 = __importDefault(require("../utils/logger"));
const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const enabled = (process.env.GEMINI_ENABLED || 'false').toLowerCase() === 'true';
let client = null;
function getClient() {
    if (!enabled || !apiKey)
        return null;
    if (!client)
        client = new genai_1.GoogleGenAI({ apiKey });
    return client;
}
async function enhanceFraudAnalysis(baseResult, ocrData) {
    const gemini = getClient();
    if (!gemini)
        return null;
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
                .filter((item) => typeof item === 'string')
                .slice(0, 5),
        };
    }
    catch (error) {
        logger_1.default.warn('Gemini fraud analysis enhancement failed. Using rule-based explanation.', error);
        return null;
    }
}
function stripJsonFence(value) {
    return value
        .trim()
        .replace(/^```(?:json)?/i, '')
        .replace(/```$/i, '')
        .trim();
}
//# sourceMappingURL=gemini.service.js.map