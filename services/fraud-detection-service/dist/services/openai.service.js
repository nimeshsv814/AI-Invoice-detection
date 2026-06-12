"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enhanceFraudAnalysis = enhanceFraudAnalysis;
const openai_1 = __importDefault(require("openai"));
const logger_1 = __importDefault(require("../utils/logger"));
const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || 'gpt-5.5';
const enabled = (process.env.OPENAI_ENABLED || 'false').toLowerCase() === 'true';
let client = null;
function getClient() {
    if (!enabled || !apiKey)
        return null;
    if (!client)
        client = new openai_1.default({ apiKey });
    return client;
}
async function enhanceFraudAnalysis(baseResult, ocrData) {
    const openai = getClient();
    if (!openai)
        return null;
    try {
        const response = await openai.responses.create({
            model,
            instructions: [
                'You are an invoice fraud analysis assistant for an accounts payable platform.',
                'Do not change the numeric risk score, risk level, or decision recommendation.',
                'Return only compact JSON with keys: explanation and recommendations.',
                'recommendations must be an array of 1 to 5 short operational actions.',
            ].join(' '),
            input: JSON.stringify({
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
        });
        const parsed = JSON.parse(response.output_text || '{}');
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
        logger_1.default.warn('OpenAI fraud analysis enhancement failed. Using rule-based explanation.', error);
        return null;
    }
}
//# sourceMappingURL=openai.service.js.map