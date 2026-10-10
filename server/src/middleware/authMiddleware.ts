import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { dbStore } from '../store/dbStore.js';
import { User } from '../models/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'parkshare-secret-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Check if x-user-role or x-user-id header is provided for demo / dev role switching
    const roleHeader = (req.headers['x-user-role'] as string) || (req.query.role as string);
    const userIdHeader = (req.headers['x-user-id'] as string) || (req.query.userId as string);
    if (userIdHeader) {
      const found = dbStore.users.find((u) => u.id === userIdHeader);
      if (found) {
        req.user = found;
        return next();
      }
    }
    if (roleHeader) {
      const found = dbStore.users.find((u) => u.role === roleHeader);
      if (found) {
        req.user = found;
        return next();
      }
    }
    res.status(401).json({ success: false, message: 'Authorization token required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (token === 'demo-driver-token') {
    req.user = dbStore.users.find((u) => u.role === 'driver') || dbStore.users[0];
    return next();
  }
  if (token === 'demo-owner-token') {
    req.user = dbStore.users.find((u) => u.role === 'owner') || dbStore.users[1];
    return next();
  }
  if (token === 'demo-admin-token') {
    req.user = dbStore.users.find((u) => u.role === 'admin') || dbStore.users[2];
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    const user = dbStore.users.find((u) => u.id === decoded.id);
    if (!user) {
      res.status(401).json({ success: false, message: 'User no longer exists' });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const optionalAuthenticate = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token === 'demo-driver-token') {
      req.user = dbStore.users.find((u) => u.role === 'driver');
      return next();
    }
    if (token === 'demo-owner-token') {
      req.user = dbStore.users.find((u) => u.role === 'owner');
      return next();
    }
    if (token === 'demo-admin-token') {
      req.user = dbStore.users.find((u) => u.role === 'admin');
      return next();
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
      const user = dbStore.users.find((u) => u.id === decoded.id);
      if (user) {
        req.user = user;
        return next();
      }
    } catch {
      // Fallback
    }
  }

  // Check headers
  const roleHeader = (req.headers['x-user-role'] as string) || (req.query.role as string);
  const userIdHeader = (req.headers['x-user-id'] as string) || (req.query.userId as string);
  if (userIdHeader) {
    const found = dbStore.users.find((u) => u.id === userIdHeader);
    if (found) {
      req.user = found;
      return next();
    }
  }
  if (roleHeader) {
    const found = dbStore.users.find((u) => u.role === roleHeader);
    if (found) {
      req.user = found;
      return next();
    }
  }

  // Allow fallback
  req.user = dbStore.users.find((u) => u.role === 'owner') || dbStore.users[0];
  next();
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Access denied: insufficient permissions' });
      return;
    }
    next();
  };
};

export const generateToken = (user: User): string => {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
};
