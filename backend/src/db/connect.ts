import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

/**
 * Reusable serverless MongoDB connection helper with in-memory connection caching
 */
export async function connectToDatabase(uri: string): Promise<typeof mongoose> {
  if (cached!.conn && mongoose.connection.readyState === 1) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached!.promise = mongoose.connect(uri, opts).then((m) => {
      return m;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (err) {
    cached!.promise = null;
    throw err;
  }

  return cached!.conn;
}
