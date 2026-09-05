const mongoose = require('mongoose');
const fs = require('fs');
const { MongoMemoryServer } = require('mongodb-memory-server');
const config = require('./env');

let mongoServer = null;
let isMemoryDB = false;

// Auto-detect native mongod binary on Windows if available to accelerate MongoMemoryServer startup
if (!process.env.MONGOMS_SYSTEM_BINARY && process.platform === 'win32') {
  const paths = [
    'C:\\Program Files\\MongoDB\\Server\\8.3\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\6.0\\bin\\mongod.exe',
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      process.env.MONGOMS_SYSTEM_BINARY = p;
      break;
    }
  }
}

/**
 * Connect to MongoDB.
 * 1. Uses config.MONGODB_URI if explicitly set (Atlas or remote Mongo).
 * 2. If config.MONGODB_URI is not set, spins up a dynamic programmatic
 *    MongoMemoryServer instance (zero-config, works with zero pre-installed Mongo).
 */
async function connectDB() {
  let uri = config.MONGODB_URI;

  if (!uri) {
    console.log('[INFO] MONGODB_URI not set. Starting in-memory MongoDB server (MongoMemoryServer)...');
    try {
      mongoServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'vaanitutor_memory',
        },
      });
      uri = mongoServer.getUri();
      isMemoryDB = true;
      console.log(`[OK] MongoMemoryServer started successfully on dynamic URI: ${uri}`);
    } catch (err) {
      console.error(`[ERROR] MongoMemoryServer failed to initialize: ${err.message}`);
      throw err;
    }
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    const targetDesc = isMemoryDB
      ? `In-Memory MongoDB Server (${uri})`
      : uri.includes('@')
      ? 'MongoDB Atlas Cluster'
      : `Local MongoDB instance (${uri})`;
    console.log(`[OK] MongoDB connected successfully to ${targetDesc}`);
    return uri;
  } catch (err) {
    console.warn(`[WARN] Primary MongoDB connection failed (${err.message}). Attempting local fallback...`);
    try {
      const localUri = 'mongodb://127.0.0.1:27017/vaanitutor';
      await mongoose.connect(localUri, { serverSelectionTimeoutMS: 3000 });
      console.log(`[OK] MongoDB connected successfully to Local MongoDB instance (${localUri})`);
      return localUri;
    } catch (localErr) {
      console.log('[INFO] Starting in-memory fallback server (MongoMemoryServer)...');
      mongoServer = await MongoMemoryServer.create({ instance: { dbName: 'vaanitutor_memory' } });
      const memUri = mongoServer.getUri();
      isMemoryDB = true;
      await mongoose.connect(memUri);
      console.log(`[OK] MongoDB connected successfully to In-Memory MongoDB Server (${memUri})`);
      return memUri;
    }
  }
}

async function stopMemoryDB() {
  if (mongoServer) {
    await mongoose.disconnect();
    await mongoServer.stop();
  }
}

function isUsingMemoryDB() {
  return isMemoryDB;
}

module.exports = { connectDB, stopMemoryDB, isUsingMemoryDB };
