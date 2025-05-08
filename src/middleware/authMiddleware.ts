import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../models/User';

// Extended Request interface to include user information
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
  };
}

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 */
export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token;
    
    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as {
        id: string;
        role: UserRole;
      };
      
      // Add user info to request
      req.user = {
        id: decoded.id,
        role: decoded.role
      };
      
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Role-based authorization middleware
 * Checks if the authenticated user has the required role
 */
export const authorize = (roles: UserRole | UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, no user found' });
    }
    
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }
    
    next();
  };
};

// Convenience middleware for specific roles
export const farmerOnly = authorize(UserRole.FARMER);
export const vendorOnly = authorize(UserRole.VENDOR);
export const ngoOnly = authorize(UserRole.NGO);
export const adminOnly = authorize(UserRole.ADMIN); 