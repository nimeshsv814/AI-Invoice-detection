import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';
import * as userRepo from '../repositories/user.repository';
import { sendSuccess, sendCreated, sendError } from '../utils/response';
import { AppError } from '../middleware/error.middleware';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.register(req.body);
    sendCreated(res, result, 'Registration successful');
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    sendSuccess(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }
    const tokens = await authService.refresh(refreshToken);
    sendSuccess(res, tokens, 'Tokens refreshed');
  } catch (err) {
    next(err);
  }
}

export async function logout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    await authService.logout(req.user.userId);
    sendSuccess(res, null, 'Logout successful');
  } catch (err) {
    next(err);
  }
}

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    const profile = await authService.getUserProfile(req.user.userId);
    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
}

// Admin only endpoints
export async function getUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const users = await userRepo.getAllUsers();
    // Strip passwords
    const usersResponse = users.map(({ passwordHash, refreshTokenHash, ...u }) => u);
    sendSuccess(res, usersResponse);
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const deleted = await userRepo.deleteUser(id);
    if (!deleted) {
      throw new AppError('User not found', 404);
    }
    sendSuccess(res, null, 'User deleted successfully');
  } catch (err) {
    next(err);
  }
}
