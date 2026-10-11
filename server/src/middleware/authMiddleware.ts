import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { dbStore } from '../store/dbStore.js';
import { User } from '../models/types.js';
import { UserModel } from '../models/mongooseModels.js';

const JWT_SECRET = process.env.JWT_SECRET || 'parkshare-secret-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authorization token required' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };

    let user: User | undefined = dbStore.users.find((u) => u.id === decoded.id);

    // If MongoDB is connected, double check directly against MongoDB to guarantee instant deletion detection
    if (dbStore.isMongoConnected) {
      const dbUser: any = await UserModel.findOne({ id: decoded.id }).lean();
      if (!dbUser) {
        // User was deleted in MongoDB! Expel immediately from memory store & deny
        dbStore.users = dbStore.users.filter((u) => u.id !== decoded.id);
        res.status(401).json({ success: false, message: 'Account has been deleted from database' });
        return;
      }
      user = {
        ...dbUser,
        id: dbUser.id || dbUser._id?.toString(),
      } as User;
    }

    if (!user) {
      res.status(401).json({ success: false, message: 'User no longer exists in database' });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const optionalAuthenticate = async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
      let user: User | undefined = dbStore.users.find((u) => u.id === decoded.id);

      if (dbStore.isMongoConnected) {
        const dbUser: any = await UserModel.findOne({ id: decoded.id }).lean();
        if (!dbUser) {
          dbStore.users = dbStore.users.filter((u) => u.id !== decoded.id);
          user = undefined;
        } else {
          user = {
            ...dbUser,
            id: dbUser.id || dbUser._id?.toString(),
          } as User;
        }
      }

      if (user) {
        req.user = user;
        return next();
      }
    } catch {
      // Fallback
    }
  }

  // Check headers (x-user-id / x-user-role)
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

  req.user = undefined;
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
