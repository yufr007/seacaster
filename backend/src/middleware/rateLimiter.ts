import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from './auth';

const prisma = new PrismaClient();

/**
 * Rate limit configuration
 */
const RATE_LIMITS = {
  CAST: {
    FREE_MAX: 3,
    FREE_WINDOW: 6 * 60 * 60 * 1000, // 6 hours in ms
    PREMIUM_MAX: 999 // Unlimited for premium
  },
  API_CALL: {
    MAX: 100,
    WINDOW: 60 * 1000 // 1 minute
  },
  TOURNAMENT_ENTRY: {
    MAX: 5,
    WINDOW: 60 * 1000 // 1 minute
  }
};

/**
 * Generic rate limiter
 */
export async function rateLimiter(
  action: 'CAST' | 'API_CALL' | 'TOURNAMENT_ENTRY',
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.fid) {
    return res.status(401).json({ error: 'Authentication required for rate limiting' });
  }

  const config = RATE_LIMITS[action];
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.WINDOW);

  try {
    // Get or create rate limit entry for this window
    const entry = await prisma.rateLimitEntry.findFirst({
      where: {
        userId: req.fid,
        action,
        windowStart: {
          gte: windowStart
        }
      }
    });

    if (entry) {
      // Check if limit exceeded
      if (entry.count >= config.MAX) {
        const resetTime = new Date(entry.windowStart.getTime() + config.WINDOW);
        const secondsRemaining = Math.ceil((resetTime.getTime() - now.getTime()) / 1000);

        return res.status(429).json({
          error: 'Rate limit exceeded',
          action,
          limit: config.MAX,
          resetIn: secondsRemaining
        });
      }

      // Increment counter
      await prisma.rateLimitEntry.update({
        where: { id: entry.id },
        data: { count: { increment: 1 } }
      });
    } else {
      // Create new entry for this window
      await prisma.rateLimitEntry.create({
        data: {
          userId: req.fid,
          action,
          count: 1,
          windowStart: now
        }
      });
    }

    next();
  } catch (error) {
    console.error('[Rate Limiter] Error:', error);
    // Don't block on rate limiter errors
    next();
  }
}

/**
 * Cast rate limiter middleware
 */
export function castRateLimiter(req: AuthRequest, res: Response, next: NextFunction) {
  return rateLimiter('CAST', req, res, next);
}

/**
 * API rate limiter middleware
 */
export function apiRateLimiter(req: AuthRequest, res: Response, next: NextFunction) {
  return rateLimiter('API_CALL', req, res, next);
}

/**
 * Tournament entry rate limiter middleware
 */
export function tournamentRateLimiter(req: AuthRequest, res: Response, next: NextFunction) {
  return rateLimiter('TOURNAMENT_ENTRY', req, res, next);
}

/**
 * Cleanup old rate limit entries (call via cron)
 */
export async function cleanupRateLimitEntries() {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 24); // Keep last 24 hours

  const deleted = await prisma.rateLimitEntry.deleteMany({
    where: {
      windowStart: {
        lt: cutoff
      }
    }
  });

  console.log(`[Rate Limiter] Cleaned up ${deleted.count} old entries`);
}
