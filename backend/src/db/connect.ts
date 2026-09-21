import dns from 'dns';
import mongoose from 'mongoose';
import { config } from '../config/index.js';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
  // eslint-disable-next-line no-var
  var mongooseEventsRegistered: boolean | undefined;
}

let cached: MongooseCache = global.mongooseCache as MongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

// Invalidate cache immediately on connection close or error
if (!global.mongooseEventsRegistered) {
  global.mongooseEventsRegistered = true;
  mongoose.connection.on('disconnected', () => {
    if (cached) {
      cached.conn = null;
      cached.promise = null;
    }
  });
  mongoose.connection.on('error', (err) => {
    if (cached) {
      cached.conn = null;
      cached.promise = null;
    }
    logSafeMongoError('Connection event error', err);
  });
}

/**
 * Sanitize error message to prevent leaking credentials or connection strings
 */
export function sanitizeMongoErrorMessage(message: string): string {
  if (!message) return 'Unknown error';
  return message
    .replace(/mongodb(\+srv)?:\/\/[^@\s]+@/gi, 'mongodb+srv://[REDACTED]@')
    .replace(/mongodb(\+srv)?:\/\/[^\s/?]+/gi, 'mongodb+srv://[REDACTED]');
}

/**
 * Log a safe, sanitized MongoDB error
 */
export function logSafeMongoError(prefix: string, err: any): void {
  const errorName = err?.name || 'MongoError';
  const rawMsg = err?.message || 'Unknown database error';
  const safeMsg = sanitizeMongoErrorMessage(rawMsg);
  const readyState = mongoose.connection.readyState;
  console.error(`[Database] ${prefix}: ${errorName} - ${safeMsg} (readyState: ${readyState})`);
}

const connectionOptions: mongoose.ConnectOptions = {
  bufferCommands: false,
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
  socketTimeoutMS: 45000,
  family: 4,
};

/**
 * Internal connection helper with optional DNS fallback for SRV resolution
 */
async function performConnect(uri: string): Promise<typeof mongoose> {
  try {
    return await mongoose.connect(uri, connectionOptions);
  } catch (err: any) {
    const isDnsError =
      err?.code === 'ECONNREFUSED' ||
      err?.message?.includes('querySrv') ||
      err?.name === 'MongoServerSelectionError';

    if (isDnsError) {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
        return await mongoose.connect(uri, connectionOptions);
      } catch (fallbackErr: any) {
        throw fallbackErr;
      }
    }
    throw err;
  }
}

/**
 * Reusable serverless MongoDB connection helper with in-memory connection caching
 */
export async function connectToDatabase(uri?: string): Promise<typeof mongoose> {
  const connectionUri = uri || config.mongodbUri;

  if (!connectionUri) {
    const err = new Error('MONGODB_URI is not defined in environment variables');
    err.name = 'ConfigurationError';
    logSafeMongoError('Connection aborted', err);
    throw err;
  }

  // 1. If connection is already open and ready, reuse it immediately
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // 2. If disconnected or in an unexpected state, reset cached connection
  if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
    cached.conn = null;
    cached.promise = null;
  }

  // 3. If a connection is not already in progress, start a new one
  if (!cached.promise) {
    cached.promise = performConnect(connectionUri)
      .then((m) => {
        cached.conn = m;
        return m;
      })
      .catch((err) => {
        cached.conn = null;
        cached.promise = null;
        logSafeMongoError('Connection attempt failed', err);
        throw err;
      });
  }

  // 4. Await active connection attempt
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.conn = null;
    cached.promise = null;
    throw err;
  } finally {
    // Clear promise once completed so subsequent reconnects don't use a stale promise
    cached.promise = null;
  }

  // 5. Verify final connection state
  if (mongoose.connection.readyState !== 1) {
    cached.conn = null;
    const stateErr = new Error(
      `Database connection readyState is ${mongoose.connection.readyState} (expected 1)`
    );
    stateErr.name = 'ConnectionStateError';
    logSafeMongoError('Connection validation failed', stateErr);
    throw stateErr;
  }

  return cached.conn;
}

/**
 * Ensure database is connected before executing any database operations.
 * Returns true if connected, false otherwise.
 */
export async function ensureDatabaseConnected(): Promise<boolean> {
  if (!config.mongodbUri) {
    console.error('[Database] Connection check: MONGODB_URI is empty/not configured');
    return false;
  }

  if (mongoose.connection.readyState === 1) {
    return true;
  }

  try {
    await connectToDatabase(config.mongodbUri);
    return (mongoose.connection.readyState as number) === 1;
  } catch (err: any) {
    logSafeMongoError('ensureDatabaseConnected failed', err);
    return false;
  }
}
