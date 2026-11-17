const mongoose = require('mongoose');

let mongod = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  try {
    let mongoUri = process.env.MONGODB_URI;

    if (mongoUri && mongoUri.trim() !== '') {
      try {
        console.log(`[DB] Attempting connection to MongoDB at: ${mongoUri.replace(/:([^:@]{3,})@/, ':***@')}`);
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
        console.log(`[DB] Connected successfully to configured MongoDB instance`);
        return;
      } catch (err) {
        console.warn(`[DB] Could not connect to configured MONGODB_URI: ${err.message}. Falling back to in-memory MongoDB...`);
      }
    }

    console.log('[DB] Initializing In-Memory MongoDB Server for frictionless local development...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    mongoUri = mongod.getUri();

    await mongoose.connect(mongoUri);
    console.log(`[DB] In-Memory MongoDB connected successfully at ${mongoUri}`);
  } catch (error) {
    console.error(`[DB Error] MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
};

module.exports = { connectDB, disconnectDB };
