"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserByEmail = findUserByEmail;
exports.findUserById = findUserById;
exports.findRoleByName = findRoleByName;
exports.findRoleById = findRoleById;
exports.createUser = createUser;
exports.updateUserLoginStats = updateUserLoginStats;
exports.updateUserRefreshToken = updateUserRefreshToken;
exports.getAllUsers = getAllUsers;
exports.deleteUser = deleteUser;
const database_1 = require("../config/database");
async function findUserByEmail(email) {
    const result = await (0, database_1.query)(`SELECT u.*, r.name as role_name
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE LOWER(u.email) = LOWER($1) LIMIT 1`, [email]);
    if (result.rowCount === 0)
        return null;
    const row = result.rows[0];
    return mapUserRow(row);
}
async function findUserById(id) {
    const result = await (0, database_1.query)(`SELECT u.*, r.name as role_name
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.id = $1 LIMIT 1`, [id]);
    if (result.rowCount === 0)
        return null;
    const row = result.rows[0];
    return mapUserRow(row);
}
async function findRoleByName(name) {
    const result = await (0, database_1.query)(`SELECT * FROM roles WHERE LOWER(name) = LOWER($1) LIMIT 1`, [name]);
    if (result.rowCount === 0)
        return null;
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
async function findRoleById(id) {
    const result = await (0, database_1.query)(`SELECT * FROM roles WHERE id = $1 LIMIT 1`, [id]);
    if (result.rowCount === 0)
        return null;
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
async function createUser(user) {
    const result = await (0, database_1.query)(`INSERT INTO users (email, password_hash, first_name, last_name, role_id, department, phone, avatar_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`, [
        user.email,
        user.passwordHash,
        user.firstName,
        user.lastName,
        user.roleId,
        user.department || null,
        user.phone || null,
        user.avatarUrl || null,
    ]);
    const row = result.rows[0];
    // role_name is populated by calling findUserById after creation or just setting it if we know it
    const createdUser = mapUserRow(row);
    const role = await findRoleById(row.role_id);
    if (role)
        createdUser.roleName = role.name;
    return createdUser;
}
async function updateUserLoginStats(id, success) {
    if (success) {
        await (0, database_1.query)(`UPDATE users
       SET last_login_at = NOW(), failed_login_attempts = 0, locked_until = NULL, updated_at = NOW()
       WHERE id = $1`, [id]);
    }
    else {
        // In production, increment failed_login_attempts, and potentially lock user
        await (0, database_1.query)(`UPDATE users
       SET failed_login_attempts = failed_login_attempts + 1, updated_at = NOW()
       WHERE id = $1`, [id]);
    }
}
async function updateUserRefreshToken(id, tokenHash) {
    await (0, database_1.query)(`UPDATE users
     SET refresh_token_hash = $2, updated_at = NOW()
     WHERE id = $1`, [id, tokenHash]);
}
async function getAllUsers() {
    const result = await (0, database_1.query)(`SELECT u.*, r.name as role_name
     FROM users u
     JOIN roles r ON u.role_id = r.id
     ORDER BY u.created_at DESC`);
    return result.rows.map(mapUserRow);
}
async function deleteUser(id) {
    const result = await (0, database_1.query)(`DELETE FROM users WHERE id = $1`, [id]);
    return (result.rowCount || 0) > 0;
}
function mapUserRow(row) {
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
//# sourceMappingURL=user.repository.js.map