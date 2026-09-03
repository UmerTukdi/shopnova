import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI || (process.env.NODE_ENV === 'production' ? '' : 'mongodb://127.0.0.1:27017/shopnova');

  if (!uri) {
    throw new Error(
      'MONGODB_URI environment variable is missing. Please define MONGODB_URI in your Vercel Project Settings > Environment Variables (e.g., mongodb+srv://<user>:<password>@cluster.mongodb.net/shopnova).'
    );
  }

  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // 10s timeout to prevent hanging on serverless
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
