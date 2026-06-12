"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRegister = validateRegister;
exports.validateLogin = validateLogin;
const error_middleware_1 = require("./error.middleware");
function validateRegister(req, res, next) {
    const { email, password, firstName, lastName, roleName } = req.body;
    const errors = {};
    if (!email || !/\S+@\S+\.\S+/.test(email))
        errors.email = 'Valid email is required';
    if (!password || password.length < 6)
        errors.password = 'Password must be at least 6 characters';
    if (!firstName || firstName.trim().length === 0)
        errors.firstName = 'First name is required';
    if (!lastName || lastName.trim().length === 0)
        errors.lastName = 'Last name is required';
    if (!roleName)
        errors.roleName = 'Role name is required';
    if (Object.keys(errors).length > 0) {
        return next(new error_middleware_1.AppError('Validation failed', 400, errors));
    }
    next();
}
function validateLogin(req, res, next) {
    const { email, password } = req.body;
    const errors = {};
    if (!email || !/\S+@\S+\.\S+/.test(email))
        errors.email = 'Valid email is required';
    if (!password)
        errors.password = 'Password is required';
    if (Object.keys(errors).length > 0) {
        return next(new error_middleware_1.AppError('Validation failed', 400, errors));
    }
    next();
}
//# sourceMappingURL=validate.middleware.js.map