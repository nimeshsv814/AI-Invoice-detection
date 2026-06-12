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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
exports.getUserProfile = getUserProfile;
const bcrypt_1 = __importDefault(require("bcrypt"));
const userRepo = __importStar(require("../repositories/user.repository"));
const jwt_utils_1 = require("../utils/jwt.utils");
const error_middleware_1 = require("../middleware/error.middleware");
async function register(userData) {
    const existingUser = await userRepo.findUserByEmail(userData.email);
    if (existingUser) {
        throw new error_middleware_1.AppError('User with this email already exists', 400);
    }
    const role = await userRepo.findRoleByName(userData.roleName);
    if (!role) {
        throw new error_middleware_1.AppError(`Role '${userData.roleName}' not found`, 404);
    }
    const saltRounds = 10;
    const passwordHash = await bcrypt_1.default.hash(userData.password, saltRounds);
    const user = await userRepo.createUser({
        email: userData.email,
        passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        roleId: role.id,
        department: userData.department,
        phone: userData.phone,
        avatarUrl: userData.avatarUrl,
    });
    const payload = { userId: user.id, email: user.email, role: role.name };
    const accessToken = (0, jwt_utils_1.generateAccessToken)(payload);
    const refreshToken = (0, jwt_utils_1.generateRefreshToken)(payload);
    const refreshTokenHash = await bcrypt_1.default.hash(refreshToken, saltRounds);
    await userRepo.updateUserRefreshToken(user.id, refreshTokenHash);
    const { passwordHash: _, refreshTokenHash: __, ...userResponse } = user;
    return {
        user: userResponse,
        tokens: { accessToken, refreshToken },
    };
}
async function login(email, password) {
    const user = await userRepo.findUserByEmail(email);
    if (!user) {
        throw new error_middleware_1.AppError('Invalid email or password', 401);
    }
    if (!user.isActive) {
        throw new error_middleware_1.AppError('Account is disabled. Please contact administrator.', 403);
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new error_middleware_1.AppError('Account is temporarily locked. Try again later.', 403);
    }
    const isPasswordValid = await bcrypt_1.default.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        await userRepo.updateUserLoginStats(user.id, false);
        throw new error_middleware_1.AppError('Invalid email or password', 401);
    }
    await userRepo.updateUserLoginStats(user.id, true);
    const roleName = user.roleName || 'finance_analyst';
    const payload = { userId: user.id, email: user.email, role: roleName };
    const accessToken = (0, jwt_utils_1.generateAccessToken)(payload);
    const refreshToken = (0, jwt_utils_1.generateRefreshToken)(payload);
    const saltRounds = 10;
    const refreshTokenHash = await bcrypt_1.default.hash(refreshToken, saltRounds);
    await userRepo.updateUserRefreshToken(user.id, refreshTokenHash);
    const { passwordHash: _, refreshTokenHash: __, ...userResponse } = user;
    return {
        user: userResponse,
        tokens: { accessToken, refreshToken },
    };
}
async function refresh(token) {
    try {
        const decoded = (0, jwt_utils_1.verifyRefreshToken)(token);
        const user = await userRepo.findUserById(decoded.userId);
        if (!user || !user.refreshTokenHash || !user.isActive) {
            throw new error_middleware_1.AppError('Invalid refresh token or inactive account', 401);
        }
        const isMatch = await bcrypt_1.default.compare(token, user.refreshTokenHash);
        if (!isMatch) {
            throw new error_middleware_1.AppError('Invalid refresh token', 401);
        }
        const roleName = user.roleName || 'finance_analyst';
        const payload = { userId: user.id, email: user.email, role: roleName };
        const accessToken = (0, jwt_utils_1.generateAccessToken)(payload);
        const newRefreshToken = (0, jwt_utils_1.generateRefreshToken)(payload);
        const saltRounds = 10;
        const refreshTokenHash = await bcrypt_1.default.hash(newRefreshToken, saltRounds);
        await userRepo.updateUserRefreshToken(user.id, refreshTokenHash);
        return {
            accessToken,
            refreshToken: newRefreshToken,
        };
    }
    catch (err) {
        if (err instanceof error_middleware_1.AppError)
            throw err;
        throw new error_middleware_1.AppError('Invalid refresh token', 401);
    }
}
async function logout(userId) {
    await userRepo.updateUserRefreshToken(userId, null);
}
async function getUserProfile(userId) {
    const user = await userRepo.findUserById(userId);
    if (!user) {
        throw new error_middleware_1.AppError('User not found', 404);
    }
    const { passwordHash: _, refreshTokenHash: __, ...userResponse } = user;
    return userResponse;
}
//# sourceMappingURL=auth.service.js.map