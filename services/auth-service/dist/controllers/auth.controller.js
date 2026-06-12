"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refreshToken = refreshToken;
exports.logout = logout;
exports.getProfile = getProfile;
exports.getUsers = getUsers;
exports.deleteUser = deleteUser;
const authService = __importStar(require("../services/auth.service"));
const userRepo = __importStar(require("../repositories/user.repository"));
const response_1 = require("../utils/response");
const error_middleware_1 = require("../middleware/error.middleware");
async function register(req, res, next) {
    try {
        const result = await authService.register(req.body);
        (0, response_1.sendCreated)(res, result, 'Registration successful');
    }
    catch (err) {
        next(err);
    }
}
async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        (0, response_1.sendSuccess)(res, result, 'Login successful');
    }
    catch (err) {
        next(err);
    }
}
async function refreshToken(req, res, next) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            throw new error_middleware_1.AppError('Refresh token is required', 400);
        }
        const tokens = await authService.refresh(refreshToken);
        (0, response_1.sendSuccess)(res, tokens, 'Tokens refreshed');
    }
    catch (err) {
        next(err);
    }
}
async function logout(req, res, next) {
    try {
        if (!req.user) {
            throw new error_middleware_1.AppError('User not authenticated', 401);
        }
        await authService.logout(req.user.userId);
        (0, response_1.sendSuccess)(res, null, 'Logout successful');
    }
    catch (err) {
        next(err);
    }
}
async function getProfile(req, res, next) {
    try {
        if (!req.user) {
            throw new error_middleware_1.AppError('User not authenticated', 401);
        }
        const profile = await authService.getUserProfile(req.user.userId);
        (0, response_1.sendSuccess)(res, profile);
    }
    catch (err) {
        next(err);
    }
}
// Admin only endpoints
async function getUsers(req, res, next) {
    try {
        const users = await userRepo.getAllUsers();
        // Strip passwords
        const usersResponse = users.map(({ passwordHash, refreshTokenHash, ...u }) => u);
        (0, response_1.sendSuccess)(res, usersResponse);
    }
    catch (err) {
        next(err);
    }
}
async function deleteUser(req, res, next) {
    try {
        const { id } = req.params;
        const deleted = await userRepo.deleteUser(id);
        if (!deleted) {
            throw new error_middleware_1.AppError('User not found', 404);
        }
        (0, response_1.sendSuccess)(res, null, 'User deleted successfully');
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=auth.controller.js.map