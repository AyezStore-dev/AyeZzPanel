import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {
  getUserByUsername,
  getUserById,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserLastLogin,
  createActivityLog,
  getActivityLogs,
  User,
  UserRole,
  UserStatus,
  LoginAttempt
} from './auth-db';

const JWT_SECRET = process.env.JWT_SECRET || 'ayezzpanel_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = '1d';

// Memory store for rate limiting brute force protection
const loginAttempts = new Map<string, LoginAttempt>();

// Rate limiting configurations
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 5 * 60 * 1000; // 5 minutes in ms

export interface AuthenticatedRequest extends Request {
  user?: User;
}

// Extract client IP address accurately
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = (forwarded as string).split(',');
    return ips[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

// Helper to check brute force blocks
export function checkBruteForceBlock(ip: string): { blocked: boolean; timeLeft?: number } {
  const record = loginAttempts.get(ip);
  if (!record) return { blocked: false };

  const now = Date.now();
  if (record.blockedUntil && record.blockedUntil > now) {
    return { blocked: true, timeLeft: Math.round((record.blockedUntil - now) / 1000) };
  }

  // Block expired, reset attempts
  if (record.blockedUntil && record.blockedUntil <= now) {
    loginAttempts.delete(ip);
  }

  return { blocked: false };
}

// Record login failure attempt
export function recordLoginAttempt(ip: string, success: boolean) {
  const now = Date.now();
  let record = loginAttempts.get(ip);

  if (!record) {
    record = { ip, attempts: 0, lastAttempt: now };
  }

  if (success) {
    loginAttempts.delete(ip);
    return;
  }

  record.attempts += 1;
  record.lastAttempt = now;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION;
  }

  loginAttempts.set(ip, record);
}

// JWT Auth Middleware
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    let token = '';
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.query.token) {
      token = req.query.token as string;
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. No session token was supplied.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
    const user = await getUserById(decoded.sub);

    if (!user) {
      return res.status(401).json({ error: 'Invalid authentication session. User not found.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: `Access Denied: Your account status is currently "${user.status}". Please contact an Administrator.` });
    }

    req.user = user;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Session expired or invalid authentication. Please log in again.' });
  }
}

// Role-based Access Control (RBAC) middleware
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication session required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to execute this administrative action.' });
    }

    next();
  };
}

// Register authentication API endpoints onto Express router
export function configureAuthRoutes(app: any) {
  
  // Public Login Endpoint (with rate limiting / brute force check)
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const ip = getClientIp(req);
    
    // 1. Check if IP block is in effect
    const blockCheck = checkBruteForceBlock(ip);
    if (blockCheck.blocked) {
      return res.status(429).json({
        error: `Brute force security lock active. Too many failed attempts. Please retry in ${blockCheck.timeLeft} seconds.`
      });
    }

    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password fields are required.' });
    }

    try {
      // 2. Fetch User
      const user = await getUserByUsername(username);
      if (!user) {
        recordLoginAttempt(ip, false);
        // Delay to avoid timing attacks
        await new Promise(r => setTimeout(r, 400));
        return res.status(401).json({ error: 'Incorrect username or password combination.' });
      }

      // 3. Status checks
      if (user.status !== 'active') {
        // Log suspension breach attempt
        await createActivityLog({
          username: user.username,
          action: 'login_denied',
          details: `Blocked login attempt of suspended user (status: ${user.status})`,
          ip_address: ip
        });
        return res.status(403).json({ error: `Login failed: Your account is currently ${user.status}.` });
      }

      // 4. Verify password
      const isMatch = bcrypt.compareSync(password, user.password_hash);
      if (!isMatch) {
        recordLoginAttempt(ip, false);
        await new Promise(r => setTimeout(r, 400));
        return res.status(401).json({ error: 'Incorrect username or password combination.' });
      }

      // 5. Successful Login - reset rate limits
      recordLoginAttempt(ip, true);
      
      // Update DB record for last login
      await updateUserLastLogin(user.id);

      // Create JWT session token
      const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      // Audit Log
      await createActivityLog({
        username: user.username,
        action: 'login',
        details: 'Successful panel admin login session established',
        ip_address: ip
      });

      // Avoid returning password hash in API
      const { password_hash, ...safeUser } = user;

      return res.json({
        success: true,
        message: 'Successfully authenticated. Redirecting to panel...',
        token,
        user: {
          ...safeUser,
          last_login: new Date().toISOString()
        }
      });

    } catch (err: any) {
      console.error('[Auth Service] Login controller core crash:', err);
      return res.status(500).json({ error: 'Internal server error during authentication routing.' });
    }
  });

  // Handle Logout Log audits
  app.post('/api/auth/logout', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ip = getClientIp(req);
      const user = req.user!;
      
      await createActivityLog({
        username: user.username,
        action: 'logout',
        details: 'Successfully logged out and dissolved active session',
        ip_address: ip
      });

      return res.json({ success: true, message: 'Active session is logged out.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Fetch logged in session data
  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const { password_hash, ...safeUser } = req.user!;
    return res.json(safeUser);
  });

  // Administrator User List Management Endpoint
  app.get('/api/auth/users', requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await getAllUsers();
      const safeUsers = users.map(u => {
        const { password_hash, ...safe } = u;
        return safe;
      });
      return res.json(safeUsers);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Administrator User Create Endpoint
  app.post('/api/auth/users', requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ip = getClientIp(req);
      const { username, email, password, role, status } = req.body;

      if (!username || !email || !password || !role || !status) {
        return res.status(400).json({ error: 'Username, email, password, role, and status are required fields.' });
      }

      // Validations
      const validRoles: UserRole[] = ['admin', 'reseller', 'client'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: `Invalid role selected. Supported: ${validRoles.join(', ')}` });
      }

      const validStatuses: UserStatus[] = ['active', 'suspended', 'disabled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status selected. Supported: ${validStatuses.join(', ')}` });
      }

      // Collisions check
      const collisionUser = await getUserByUsername(username);
      if (collisionUser) {
        return res.status(400).json({ error: 'Username already registered to another user profile.' });
      }

      const salt = bcrypt.genSaltSync(10);
      const password_hash = bcrypt.hashSync(password, salt);

      const newUser = await createUser({
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password_hash,
        role,
        status
      });

      await createActivityLog({
        username: req.user!.username,
        action: 'create_user',
        details: `Successfully created user account: @${username} (Role: ${role}, Status: ${status})`,
        ip_address: ip
      });

      const { password_hash: _discard, ...safeUser } = newUser;
      return res.json({ success: true, user: safeUser });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Administrator User Update Endpoint
  app.put('/api/auth/users/:id', requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ip = getClientIp(req);
      const { id } = req.params;
      const { email, role, status } = req.body;

      const target = await getUserById(id);
      if (!target) {
        return res.status(404).json({ error: 'Target user not found.' });
      }

      // Secure self modifications
      if (id === req.user!.id && role && role !== req.user!.role) {
        return res.status(400).json({ error: 'You are forbidden from altering your own administrative access privileges.' });
      }

      const updates: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>> = {};
      if (email !== undefined) updates.email = email.trim().toLowerCase();
      if (role !== undefined) updates.role = role;
      if (status !== undefined) updates.status = status;

      const updated = await updateUser(id, updates);
      
      await createActivityLog({
        username: req.user!.username,
        action: 'edit_user',
        details: `Updated details for user ID: ${id} (@${target.username})`,
        ip_address: ip
      });

      if (updated) {
        const { password_hash, ...safe } = updated;
        return res.json({ success: true, user: safe });
      }
      return res.status(400).json({ error: 'Failed to apply profile updates.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // User Self & Administrator Change Password Route
  app.post('/api/auth/users/:id/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ip = getClientIp(req);
      const { id } = req.params;
      const { password } = req.body;

      if (!password || password.length < 5) {
        return res.status(400).json({ error: 'Password code length must exceed at least 5 character symbols.' });
      }

      // Check access permission: Only Admins can modify other users' password, standard client can modify their own.
      const isSelf = id === req.user!.id;
      const isAdmin = req.user!.role === 'admin';

      if (!isSelf && !isAdmin) {
        return res.status(403).json({ error: 'Unauthorized: You do not possess clearance to change another user password.' });
      }

      const target = await getUserById(id);
      if (!target) {
        return res.status(404).json({ error: 'Target user profile not found.' });
      }

      const salt = bcrypt.genSaltSync(10);
      const password_hash = bcrypt.hashSync(password, salt);

      await updateUser(id, { password_hash });

      await createActivityLog({
        username: req.user!.username,
        action: 'change_password',
        details: isSelf ? `User successfully changed their own password code.` : `Administrator updated password for @${target.username}.`,
        ip_address: ip
      });

      return res.json({ success: true, message: 'Password updated successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // User Audit Logs (Admin clearance only)
  app.get('/api/auth/logs', requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const logs = await getActivityLogs();
      return res.json(logs);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });
}
