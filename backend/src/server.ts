import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import * as Sentry from '@sentry/node';

// Import GraphQL schema and resolvers
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';

// Import middleware
import { optionalAuth, verifyToken, buildGraphQLContext } from './middleware/auth';
import { apiRateLimiter } from './middleware/rateLimiter';
import { cleanupRateLimitEntries } from './middleware/rateLimiter';

// Import services
import { tournamentService } from './services/tournamentService';
import { marketplaceService } from './services/marketplaceService';

// Import Socket.IO
import { initializeSocketIO } from './sockets/tournamentSocket';

// Import routes
import webhookRoutes from './routes/webhook';
import gameRoutes from './routes/game';
import usersRoutes from './routes/users';
import tournamentsRoutes from './routes/tournaments';
import leaderboardRoutes from './routes/leaderboard';
import { registerScoreRoutes } from './routes/scores';

// Load environment variables
dotenv.config();

// Initialize Sentry
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration()
    ],
  });
  console.log('[Sentry] Monitoring initialized');
}

const app = express();
const httpServer = createServer(app);

// Prisma is optional - only use if explicitly enabled
let prisma: any = null;
if (process.env.USE_PRISMA === 'true') {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
  console.log('[Database] Using Prisma ORM');
} else {
  console.log('[Database] Using Supabase REST API');
}

const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ===== MIDDLEWARE =====

app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://seacaster.app',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ===== APOLLO GRAPHQL SERVER =====
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (error) => {
    console.error('[GraphQL Error]', error);
    return error;
  },
  introspection: NODE_ENV !== 'production',
  includeStacktraceInErrorResponses: NODE_ENV !== 'production'
});

// Initialize Apollo Server
async function startApolloServer() {
  await apolloServer.start();

  app.use(
    '/graphql',
    optionalAuth, // Attach user context if token provided
    expressMiddleware(apolloServer, {
      context: buildGraphQLContext
    })
  );

  console.log('[GraphQL] Apollo Server started at /graphql');
}

// ===== SOCKET.IO =====
const io = initializeSocketIO(httpServer);
console.log('[Socket.IO] Real-time server initialized');

// ===== REST API ROUTES =====
app.use('/api/webhook', webhookRoutes);
app.use('/api/game', verifyToken, apiRateLimiter, gameRoutes);
app.use('/api/users', apiRateLimiter, usersRoutes);
app.use('/api/tournaments', apiRateLimiter, tournamentsRoutes);
app.use('/api/leaderboard', apiRateLimiter, leaderboardRoutes);
registerScoreRoutes(app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Ping endpoint (for monitoring)
app.get('/ping', (req, res) => {
  res.send('pong');
});

// ===== CRON JOBS =====

// Check and settle ended tournaments (every 5 minutes)
cron.schedule('*/5 * * * *', async () => {
  console.log('[Cron] Checking for ended tournaments...');
  try {
    await tournamentService.checkAndSettleEndedTournaments();
  } catch (error) {
    console.error('[Cron] Error settling tournaments:', error);
  }
});

// Auto-create tournament instances (every hour)
cron.schedule('0 * * * *', async () => {
  console.log('[Cron] Auto-creating tournament instances...');
  try {
    await tournamentService.autoCreateTournaments();
  } catch (error) {
    console.error('[Cron] Error auto-creating tournaments:', error);
  }
});

// Expire old marketplace listings (every hour)
cron.schedule('0 * * * *', async () => {
  console.log('[Cron] Expiring old marketplace listings...');
  try {
    await marketplaceService.expireOldListings();
  } catch (error) {
    console.error('[Cron] Error expiring listings:', error);
  }
});

// Cleanup old rate limit entries (daily at 2am)
cron.schedule('0 2 * * *', async () => {
  console.log('[Cron] Cleaning up rate limit entries...');
  try {
    await cleanupRateLimitEntries();
  } catch (error) {
    console.error('[Cron] Error cleaning rate limits:', error);
  }
});

// ===== ERROR HANDLING =====

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server Error]', err);

  // Log to audit trail for critical errors
  if (err.statusCode >= 500) {
    prisma.auditLog.create({
      data: {
        action: 'SERVER_ERROR',
        details: {
          error: err.message,
          stack: err.stack,
          path: req.path,
          method: req.method
        }
      }
    }).catch(console.error);
  }

  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',
    ...(NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ===== SERVER STARTUP =====

async function startServer() {
  try {
    // Test database connection (Soft Fail for SQL)
    if (prisma) {
      try {
        await prisma.$connect();
        console.log('[Database] Connected to PostgreSQL via Prisma');
      } catch (e: any) {
        console.warn(`[Database] Prisma connection failed: ${e.message}. Using Supabase REST.`);
        prisma = null;
      }
    }

    // Start Apollo GraphQL
    await startApolloServer();

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════╗
║           🎣 SEACASTER BACKEND 🎣              ║
║                                               ║
║  Environment: ${NODE_ENV.padEnd(31)}║
║  Port:        ${PORT.toString().padEnd(31)}║
║  GraphQL:     http://localhost:${PORT}/graphql${' '.repeat(8)}║
║  Socket.IO:   ws://localhost:${PORT}${' '.repeat(16)}║
║  Health:      http://localhost:${PORT}/health${' '.repeat(9)}║
╚═══════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('[Startup Error]', error);
    process.exit(1);
  }
}

// ===== GRACEFUL SHUTDOWN =====

process.on('SIGTERM', async () => {
  console.log('[Shutdown] SIGTERM received, closing server gracefully...');

  httpServer.close(async () => {
    if (prisma) await prisma.$disconnect();
    console.log('[Shutdown] Server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('[Shutdown] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', async () => {
  console.log('[Shutdown] SIGINT received, closing server gracefully...');

  httpServer.close(async () => {
    if (prisma) await prisma.$disconnect();
    console.log('[Shutdown] Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[Uncaught Exception]', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection]', reason);
  process.exit(1);
});

// Start the server
startServer();

export { app, httpServer, io };
