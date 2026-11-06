import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer = null;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log(`Connecting to MongoDB at specified URI...`);
      await mongoose.connect(uri);
      console.log(`Connected successfully to MongoDB Database`);
      return;
    } catch (err) {
      console.warn(`Failed to connect to specified MongoDB URI: ${err.message}. Switching to in-memory MongoDB...`);
    }
  }

  // Fallback to in-memory MongoDB for zero-configuration execution
  try {
    console.log(`Starting isolated In-Memory MongoDB Server...`);
    mongoMemoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'buywise_db'
      }
    });
    const memoryUri = mongoMemoryServer.getUri();
    await mongoose.connect(memoryUri);
    console.log(`Connected successfully to In-Memory MongoDB (${memoryUri})`);
  } catch (error) {
    console.error(`MongoDB Connection Error:`, error.message);
    throw error;
  }
}

export async function closeDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
}

