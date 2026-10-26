import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getApps } from 'firebase-admin/app';
import User from '../models/User';

export interface AuthRequest extends Request {
  user?: any;
}

import jwt from 'jsonwebtoken';

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Unauthorized: Missing token' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'gridwise_super_secret_key_2026';

    let decodedToken: any;
    try {
      decodedToken = jwt.verify(token, jwtSecret);
    } catch (e) {
      // If standard JWT fails, fallback to Firebase check (for legacy tokens)
      if (getApps().length) {
         try {
           decodedToken = await getAuth().verifyIdToken(token);
         } catch (firebaseErr) {
           throw new Error('Invalid token');
         }
      } else {
         throw new Error('Invalid token');
      }
    }

    // Support both new _id based JWT and old firebaseUid based JWT
    const query = decodedToken.userId 
      ? { _id: decodedToken.userId } 
      : { firebaseUid: decodedToken.uid };

    const user = await User.findOne(query);
    
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized: User profile not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[AuthMiddleware] Verification Error:', error);
    res.status(401).json({ success: false, message: 'Unauthorized: Invalid or expired token' });
  }
};

export const requireRole = (role: 'USER' | 'ADMIN') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== role) {
      res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });
      return;
    }
    next();
  };
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });
      return;
    }
    next();
  };
};
