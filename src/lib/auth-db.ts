import pg from 'pg';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

// User role types matching instructions
export type UserRole = 'admin' | 'reseller' | 'client';
// User status types matching instructions
export type UserStatus = 'active' | 'suspended' | 'disabled';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface ActivityLog {
  id: string;
  username: string;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export interface LoginAttempt {
  ip: string;
  attempts: number;
  lastAttempt: number;
  blockedUntil?: number;
}

const LOCAL_DB_PATH = path.join(process.cwd(), 'database', 'cpanel', 'users_db.json');

// Ensure parent folder exists
try {
  const dir = path.dirname(LOCAL_DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
} catch (e) {
  console.error('Failed to create local database directory:', e);
}

// PostgreSQL configuration setup
const dbUrl = process.env.DATABASE_URL || '';
const pgConfig: pg.PoolConfig = dbUrl
  ? { connectionString: dbUrl, ssl: dbUrl.includes('render') || dbUrl.includes('aws') ? { rejectUnauthorized: false } : undefined }
  : {
      host: process.env.PGHOST,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : undefined,
    };

let pgPool: pg.Pool | null = null;
let usePostgre = false;

// Attempt to initialize PG Pool
if (dbUrl || process.env.PGHOST) {
  try {
    pgPool = new pg.Pool(pgConfig);
    console.log('[Auth DB] PostgreSQL Pool initialized. Querying connection health...');
    usePostgre = true;
  } catch (err: any) {
    console.error('[Auth DB] PostgreSQL Pool creation error:', err.message);
    usePostgre = false;
  }
} else {
  console.log('[Auth DB] PG environment vars not set. Emulating PostgreSQL storage in JSON...');
}

// Memory block for local fallback
interface LocalStorageSchema {
  users: User[];
  activityLogs: ActivityLog[];
}

function readLocalStorage(): LocalStorageSchema {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const data = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      return {
        users: parsed.users || [],
        activityLogs: parsed.activityLogs || [],
      };
    }
  } catch (e) {
    console.error('[Auth DB] Local file read failure:', e);
  }
  return { users: [], activityLogs: [] };
}

function writeLocalStorage(data: LocalStorageSchema) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Auth DB] Local file write failure:', e);
  }
}

// Initialize tables or fallback schema
export async function initializeDatabase() {
  const initialAdminUsername = process.env.ADMIN_USERNAME || 'admin';
  const initialAdminEmail = process.env.ADMIN_EMAIL || 'admin@ayezzpanel.com';
  const initialAdminPlainPassword = process.env.ADMIN_PASSWORD || 'ayezz123';
  const salt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync(initialAdminPlainPassword, salt);

  if (usePostgre && pgPool) {
    try {
      // Test the PG connection first
      const client = await pgPool.connect();
      console.log('[Auth DB] PostgreSQL successfully connected.');
      
      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(100) PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          email VARCHAR(150) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL,
          status VARCHAR(50) NOT NULL,
          created_at TIMESTAMP NOT NULL,
          updated_at TIMESTAMP NOT NULL,
          last_login TIMESTAMP
        );
      `);

      // Create activity logs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS activity_logs (
          id VARCHAR(100) PRIMARY KEY,
          username VARCHAR(100) NOT NULL,
          action VARCHAR(100) NOT NULL,
          details TEXT,
          ip_address VARCHAR(100) NOT NULL,
          created_at TIMESTAMP NOT NULL
        );
      `);
      
      // Check if superadmin already exists
      const checkRes = await client.query('SELECT * FROM users WHERE role = $1', ['admin']);
      if (checkRes.rowCount === 0) {
        const id = 'admin-' + Date.now().toString(36);
        const now = new Date();
        await client.query(
          'INSERT INTO users (id, username, email, password_hash, role, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [id, initialAdminUsername, initialAdminEmail, adminPasswordHash, 'admin', 'active', now, now]
        );
        console.log(`[Auth DB] Default Super Admin created in pg table state. Username: ${initialAdminUsername}`);
      }
      
      client.release();
      return;
    } catch (err: any) {
      console.warn('[Auth DB] PostgreSQL Database setup failed, falling back to local storage engine:', err.message);
      usePostgre = false;
    }
  }

  // Fallback storage setup
  const local = readLocalStorage();
  // Ensure we have at least one active admin
  const hasAdmin = local.users.some(u => u.role === 'admin');
  if (!hasAdmin) {
    const id = 'admin-fallback';
    const now = new Date().toISOString();
    const defaultAdmin: User = {
      id,
      username: initialAdminUsername,
      email: initialAdminEmail,
      password_hash: adminPasswordHash,
      role: 'admin',
      status: 'active',
      created_at: now,
      updated_at: now,
    };
    local.users.push(defaultAdmin);
    writeLocalStorage(local);
    console.log(`[Auth DB Fallback] Created Default Super Admin in local users. Username: ${initialAdminUsername} / Email: ${initialAdminEmail}`);
  }
}

// User-Retrieval Services
export async function getUserByUsername(username: string): Promise<User | null> {
  const normalized = username.toLowerCase().trim();
  if (usePostgre && pgPool) {
    try {
      const res = await pgPool.query('SELECT * FROM users WHERE LOWER(username) = $1', [normalized]);
      if (res.rowCount && res.rows[0]) {
        return res.rows[0];
      }
      return null;
    } catch (err) {
      console.error('[Auth DB] Query getUserByUsername failed in db:', err);
    }
  }
  
  const local = readLocalStorage();
  const found = local.users.find(u => u.username.toLowerCase() === normalized);
  return found || null;
}

export async function getUserById(id: string): Promise<User | null> {
  if (usePostgre && pgPool) {
    try {
      const res = await pgPool.query('SELECT * FROM users WHERE id = $1', [id]);
      if (res.rowCount && res.rows[0]) {
        return res.rows[0];
      }
      return null;
    } catch (err) {
      console.error('[Auth DB] Query getUserById failed in db:', err);
    }
  }
  
  const local = readLocalStorage();
  const found = local.users.find(u => u.id === id);
  return found || null;
}

export async function getAllUsers(): Promise<User[]> {
  if (usePostgre && pgPool) {
    try {
      const res = await pgPool.query('SELECT * FROM users ORDER BY created_at DESC');
      return res.rows;
    } catch (err) {
      console.error('[Auth DB] Query getAllUsers failed in db:', err);
    }
  }
  
  const local = readLocalStorage();
  return local.users;
}

export async function createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
  const id = 'usr-' + Math.random().toString(36).substr(2, 9);
  const now = new Date().toISOString();
  const newUser: User = {
    ...user,
    id,
    created_at: now,
    updated_at: now,
  };

  if (usePostgre && pgPool) {
    try {
      await pgPool.query(
        'INSERT INTO users (id, username, email, password_hash, role, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [id, newUser.username, newUser.email, newUser.password_hash, newUser.role, newUser.status, new Date(now), new Date(now)]
      );
      return newUser;
    } catch (err) {
      console.error('[Auth DB] Query createUser failed in db:', err);
      throw err;
    }
  }

  const local = readLocalStorage();
  // Check collision
  if (local.users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase())) {
    throw new Error('Username already exists');
  }
  if (local.users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase())) {
    throw new Error('Email already exists');
  }
  local.users.push(newUser);
  writeLocalStorage(local);
  return newUser;
}

export async function updateUser(id: string, updates: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): Promise<User | null> {
  const now = new Date().toISOString();
  if (usePostgre && pgPool) {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      for (const [key, val] of Object.entries(updates)) {
        fields.push(`${key} = $${idx}`);
        values.push(val);
        idx++;
      }

      fields.push(`updated_at = $${idx}`);
      values.push(new Date(now));
      idx++;

      values.push(id);
      const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
      const res = await pgPool.query(query, values);
      return res.rows[0] || null;
    } catch (err) {
      console.error('[Auth DB] Query updateUser failed in db:', err);
      throw err;
    }
  }

  const local = readLocalStorage();
  const uIdx = local.users.findIndex(u => u.id === id);
  if (uIdx === -1) return null;

  const updatedUser: User = {
    ...local.users[uIdx],
    ...updates,
    updated_at: now,
  };
  local.users[uIdx] = updatedUser;
  writeLocalStorage(local);
  return updatedUser;
}

export async function updateUserLastLogin(id: string): Promise<void> {
  const now = new Date().toISOString();
  if (usePostgre && pgPool) {
    try {
      await pgPool.query('UPDATE users SET last_login = $1 WHERE id = $2', [new Date(now), id]);
      return;
    } catch (err) {
      console.error('[Auth DB] Query updateUserLastLogin failed in db:', err);
    }
  }

  const local = readLocalStorage();
  const uIdx = local.users.findIndex(u => u.id === id);
  if (uIdx !== -1) {
    local.users[uIdx].last_login = now;
    writeLocalStorage(local);
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  if (usePostgre && pgPool) {
    try {
      const result = await pgPool.query('DELETE FROM users WHERE id = $1', [id]);
      return (result.rowCount ?? 0) > 0;
    } catch (err) {
      console.error('[Auth DB] Query deleteUser failed in db:', err);
      throw err;
    }
  }

  const local = readLocalStorage();
  const initialLen = local.users.length;
  local.users = local.users.filter(u => u.id !== id);
  writeLocalStorage(local);
  return local.users.length < initialLen;
}

// Activity Logging Audits
export async function createActivityLog(log: Omit<ActivityLog, 'id' | 'created_at'>): Promise<ActivityLog> {
  const id = 'log-' + Math.random().toString(36).substr(2, 9);
  const now = new Date().toISOString();
  const newLog: ActivityLog = {
    ...log,
    id,
    created_at: now,
  };

  if (usePostgre && pgPool) {
    try {
      await pgPool.query(
        'INSERT INTO activity_logs (id, username, action, details, ip_address, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, newLog.username, newLog.action, newLog.details, newLog.ip_address, new Date(now)]
      );
      return newLog;
    } catch (err) {
      console.error('[Auth DB] Query createActivityLog failed in db:', err);
    }
  }

  const local = readLocalStorage();
  local.activityLogs.unshift(newLog);
  if (local.activityLogs.length > 2000) {
    local.activityLogs.pop(); // keep log counts safe
  }
  writeLocalStorage(local);
  return newLog;
}

export async function getActivityLogs(): Promise<ActivityLog[]> {
  if (usePostgre && pgPool) {
    try {
      const res = await pgPool.query('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 500');
      return res.rows;
    } catch (err) {
      console.error('[Auth DB] Query getActivityLogs failed in db:', err);
    }
  }

  const local = readLocalStorage();
  return local.activityLogs;
}
