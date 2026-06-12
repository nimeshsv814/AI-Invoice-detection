"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendCreated = sendCreated;
exports.sendPaginated = sendPaginated;
exports.sendError = sendError;
function sendSuccess(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
}
function sendCreated(res, data, message = 'Created') {
    return sendSuccess(res, data, message, 201);
}
function sendPaginated(res, data, total, page, limit, message = 'Success') {
    return res.status(200).json({
        success: true,
        message,
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
}
function sendError(res, message, statusCode = 500, errors = null) {
    return res.status(statusCode).json({
        success: false,
        message,
        errors,
    });
}
//# sourceMappingURL=response.js.map