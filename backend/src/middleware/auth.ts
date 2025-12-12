import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export interface AuthRequest extends Request {
  fid?: number;
  isAdmin?: boolean;
}

/**
 * JWT payload interface
 */
interface JWTPayload {
  fid: number;
  username: string;
  isAdmin?: boolean;
}

/**
 * Generate JWT token for authenticated user
 */
export function generateToken(fid: number, username: string, isAdmin: boolean = false): string {
  return jwt.sign(
    { fid, username, isAdmin } as JWTPayload,
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verify JWT token from Authorization header
 */
export function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    req.fid = decoded.fid;
    req.isAdmin = decoded.isAdmin || false;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    req.fid = decoded.fid;
    req.isAdmin = decoded.isAdmin || false;
  } catch (error) {
    // Silently fail for optional auth
  }

  next();
}

/**
 * Require admin privileges
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Admin privileges required' });
  }

  next();
}

/**
 * Context builder for GraphQL
 */
export function buildGraphQLContext({ req }: { req: AuthRequest }): {
  fid?: number;
  isAuthenticated: boolean;
  isAdmin: boolean;
} {
  return {
    fid: req.fid,
    isAuthenticated: !!req.fid,
    isAdmin: req.isAdmin || false
  };
}
