import { query } from '../config/database';
import { User, Role } from '../models/user.model';

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await query<any>(
    `SELECT u.*, r.name as role_name
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE LOWER(u.email) = LOWER($1) LIMIT 1`,
    [email]
  );
  if (result.rowCount === 0) return null;
  const row = result.rows[0];
  return mapUserRow(row);
}

export async function findUserById(id: string): Promise<User | null> {
  const result = await query<any>(
    `SELECT u.*, r.name as role_name
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.id = $1 LIMIT 1`,
    [id]
  );
  if (result.rowCount === 0) return null;
  const row = result.rows[0];
  return mapUserRow(row);
}

export async function findRoleByName(name: string): Promise<Role | null> {
  const result = await query<any>(
    `SELECT * FROM roles WHERE LOWER(name) = LOWER($1) LIMIT 1`,
    [name]
  );
  if (result.rowCount === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    permissions: Array.isArray(row.permissions) ? row.permissions : JSON.parse(row.permissions || '[]'),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function findRoleById(id: string): Promise<Role | null> {
  const result = await query<any>(
    `SELECT * FROM roles WHERE id = $1 LIMIT 1`,
    [id]
  );
  if (result.rowCount === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    permissions: Array.isArray(row.permissions) ? row.permissions : JSON.parse(row.permissions || '[]'),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function createUser(user: Omit<User, 'id' | 'isActive' | 'isEmailVerified' | 'failedLoginAttempts' | 'createdAt' | 'updatedAt'>): Promise<User> {
  const result = await query<any>(
    `INSERT INTO users (email, password_hash, first_name, last_name, role_id, department, phone, avatar_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      user.email,
      user.passwordHash,
      user.firstName,
      user.lastName,
      user.roleId,
      user.department || null,
      user.phone || null,
      user.avatarUrl || null,
    ]
  );
  const row = result.rows[0];
  // role_name is populated by calling findUserById after creation or just setting it if we know it
  const createdUser = mapUserRow(row);
  const role = await findRoleById(row.role_id);
  if (role) createdUser.roleName = role.name;
  return createdUser;
}

export async function updateUserLoginStats(id: string, success: boolean): Promise<void> {
  if (success) {
    await query(
      `UPDATE users
       SET last_login_at = NOW(), failed_login_attempts = 0, locked_until = NULL, updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
  } else {
    // In production, increment failed_login_attempts, and potentially lock user
    await query(
      `UPDATE users
       SET failed_login_attempts = failed_login_attempts + 1, updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
  }
}

export async function updateUserRefreshToken(id: string, tokenHash: string | null): Promise<void> {
  await query(
    `UPDATE users
     SET refresh_token_hash = $2, updated_at = NOW()
     WHERE id = $1`,
    [id, tokenHash]
  );
}

export async function getAllUsers(): Promise<User[]> {
  const result = await query<any>(
    `SELECT u.*, r.name as role_name
     FROM users u
     JOIN roles r ON u.role_id = r.id
     ORDER BY u.created_at DESC`
  );
  return result.rows.map(mapUserRow);
}

export async function deleteUser(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM users WHERE id = $1`, [id]);
  return (result.rowCount || 0) > 0;
}

function mapUserRow(row: any): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    firstName: row.first_name,
    lastName: row.last_name,
    roleId: row.role_id,
    roleName: row.role_name,
    department: row.department,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    isActive: row.is_active,
    isEmailVerified: row.is_email_verified,
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : undefined,
    failedLoginAttempts: row.failed_login_attempts || 0,
    lockedUntil: row.locked_until ? new Date(row.locked_until) : undefined,
    refreshTokenHash: row.refresh_token_hash,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
