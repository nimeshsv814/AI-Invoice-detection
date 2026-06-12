"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.authorize = authorize;
const jwt_utils_1 = require("../utils/jwt.utils");
const error_middleware_1 = require("./error.middleware");
function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new error_middleware_1.AppError('Authentication token missing or invalid', 401);
        }
        const token = authHeader.split(' ')[1];
        const decoded = (0, jwt_utils_1.verifyAccessToken)(token);
        req.user = decoded;
        next();
    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            next(new error_middleware_1.AppError('Token has expired', 401));
        }
        else if (err.name === 'JsonWebTokenError') {
            next(new error_middleware_1.AppError('Invalid token', 401));
        }
        else {
            next(err);
        }
    }
}
function authorize(roles, ...moreRoles) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles, ...moreRoles];
    return (req, res, next) => {
        if (!req.user) {
            return next(new error_middleware_1.AppError('User not authenticated', 401));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(new error_middleware_1.AppError('Access forbidden: insufficient permissions', 403));
        }
        next();
    };
}
//# sourceMappingURL=auth.middleware.js.map