"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
exports.buildEmailHtml = buildEmailHtml;
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = __importDefault(require("../utils/logger"));
let transporter = null;
function getTransporter() {
    if (!transporter) {
        transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: false,
            auth: {
                user: process.env.SMTP_USER || '',
                pass: process.env.SMTP_PASS || '',
            },
        });
    }
    return transporter;
}
async function sendEmail(options) {
    try {
        const t = getTransporter();
        await t.sendMail({
            from: `"InvoiceAI Platform" <${process.env.SMTP_USER || 'noreply@invoiceplatform.com'}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text || options.html.replace(/<[^>]*>/g, ''),
        });
        logger_1.default.info(`Email sent successfully to ${options.to}`);
        return true;
    }
    catch (err) {
        logger_1.default.error(`Failed to send email to ${options.to}: ${err.message}`);
        return false;
    }
}
function buildEmailHtml(title, message, priority) {
    const priorityColor = priority === 'urgent' ? '#ef4444' :
        priority === 'high' ? '#f97316' :
            priority === 'normal' ? '#3b82f6' : '#6b7280';
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; background: #f3f4f6; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,.07); }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px 40px; }
    .header h1 { color: #fff; margin: 0; font-size: 20px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; color: #fff; background: ${priorityColor}; margin-top: 8px; }
    .body { padding: 30px 40px; }
    .body p { color: #374151; line-height: 1.6; font-size: 15px; }
    .footer { padding: 20px 40px; background: #f9fafb; text-align: center; color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧾 InvoiceAI Platform</h1>
      <span class="badge">${priority.toUpperCase()}</span>
    </div>
    <div class="body">
      <h2 style="color:#111827;margin-top:0">${title}</h2>
      <p>${message}</p>
      <p>Please log in to the InvoiceAI platform to review and take action.</p>
    </div>
    <div class="footer">
      <p>© 2024 InvoiceAI Platform. This is an automated notification — please do not reply.</p>
    </div>
  </div>
</body>
</html>`;
}
//# sourceMappingURL=email.js.map