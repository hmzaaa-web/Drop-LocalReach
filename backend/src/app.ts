import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import fileRoutes from './routes/fileRoutes.js';
import qrRoutes from './routes/qrRoutes.js';
import cronRoutes from './routes/cronRoutes.js';
import { connectToDatabase } from './db/connect.js';

const app = express();

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server, same-origin)
      if (!origin) return callback(null, true);

      const isAllowed =
        config.corsOrigins.includes(origin) ||
        config.corsOrigins.includes('*') ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:');

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('CORS origin not allowed'));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection middleware for warm Serverless Function invocations
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    if (config.mongodbUri) {
      await connectToDatabase(config.mongodbUri);
    }
  } catch (err: any) {
    // Log safe error without connection string
    console.error('[Database] Connection check failed:', err?.message || 'Unknown error');
  }
  next();
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'DROP by LocalReach API',
    expirationDays: config.fileExpirationDays,
    contactUrl: config.contactUrl,
  });
});

// API Routes
app.use('/api', fileRoutes);
app.use('/api', qrRoutes);
app.use('/api', cronRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Central error handling middleware - clean, sanitized errors
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  // Safe server logging
  console.error('[AppError]', err?.message || err);

  // User-facing error message (never leak credentials or traces)
  res.status(500).json({
    error: 'An unexpected error occurred while processing your request.',
  });
});

export default app;
