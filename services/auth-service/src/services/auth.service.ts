import bcrypt from 'bcrypt';
import * as userRepo from '../repositories/user.repository';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.utils';
import { AppError } from '../middleware/error.middleware';
import { User } from '../models/user.model';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash' | 'refreshTokenHash'>;
  tokens: AuthTokens;
}

export async function register(userData: {
  email: string;
  password:  string;
  firstName: string;
  lastName:  string;
  roleName:  string;
  department?: string;
  phone?: string;
  avatarUrl?: string;
}): Promise<AuthResponse> {
  const existingUser = await userRepo.findUserByEmail(userData.email);
  if (existingUser) {
    throw new AppError('User with this email already exists', 400);
  }

  const role = await userRepo.findRoleByName(userData.roleName);
  if (!role) {
    throw new AppError(`Role '${userData.roleName}' not found`, 404);
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(userData.password, saltRounds);

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
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const refreshTokenHash = await bcrypt.hash(refreshToken, saltRounds);
  await userRepo.updateUserRefreshToken(user.id, refreshTokenHash);

  const { passwordHash: _, refreshTokenHash: __, ...userResponse } = user;

  return {
    user: userResponse,
    tokens: { accessToken, refreshToken },
  };
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const user = await userRepo.findUserByEmail(email);
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('Account is disabled. Please contact administrator.', 403);
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AppError('Account is temporarily locked. Try again later.', 403);
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    await userRepo.updateUserLoginStats(user.id, false);
    throw new AppError('Invalid email or password', 401);
  }

  await userRepo.updateUserLoginStats(user.id, true);

  const roleName = user.roleName || 'finance_analyst';
  const payload = { userId: user.id, email: user.email, role: roleName };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const saltRounds = 10;
  const refreshTokenHash = await bcrypt.hash(refreshToken, saltRounds);
  await userRepo.updateUserRefreshToken(user.id, refreshTokenHash);

  const { passwordHash: _, refreshTokenHash: __, ...userResponse } = user;

  return {
    user: userResponse,
    tokens: { accessToken, refreshToken },
  };
}

export async function refresh(token: string): Promise<AuthTokens> {
  try {
    const decoded = verifyRefreshToken(token);
    const user = await userRepo.findUserById(decoded.userId);

    if (!user || !user.refreshTokenHash || !user.isActive) {
      throw new AppError('Invalid refresh token or inactive account', 401);
    }

    const isMatch = await bcrypt.compare(token, user.refreshTokenHash);
    if (!isMatch) {
      throw new AppError('Invalid refresh token', 401);
    }

    const roleName = user.roleName || 'finance_analyst';
    const payload = { userId: user.id, email: user.email, role: roleName };
    const accessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    const saltRounds = 10;
    const refreshTokenHash = await bcrypt.hash(newRefreshToken, saltRounds);
    await userRepo.updateUserRefreshToken(user.id, refreshTokenHash);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    throw new AppError('Invalid refresh token', 401);
  }
}

export async function logout(userId: string): Promise<void> {
  await userRepo.updateUserRefreshToken(userId, null);
}

export async function getUserProfile(userId: string): Promise<Omit<User, 'passwordHash' | 'refreshTokenHash'>> {
  const user = await userRepo.findUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  const { passwordHash: _, refreshTokenHash: __, ...userResponse } = user;
  return userResponse;
}
