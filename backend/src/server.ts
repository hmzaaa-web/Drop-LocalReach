import mongoose from 'mongoose';
import app from './app.js';
import { config } from './config/index.js';
import { initCleanupJob } from './services/cleanupService.js';
import { getStorageService } from './storage/index.js';
import { connectToDatabase } from './db/connect.js';

async function bootstrap() {
  console.log('--------------------------------------------------');
  console.log('🚀 DROP by LocalReach - Temporary File Sharing API');
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`⏱️ Expiration: ${config.fileExpirationDays} days`);
  console.log(`📦 Max File Size: ${config.maxFileSizeMb} MB`);
  console.log('--------------------------------------------------');

  // Initialize Storage Provider early to verify configuration
  try {
    getStorageService();
  } catch (err) {
    console.error('❌ Failed to initialize storage service:', err);
  }

  // Connect to MongoDB
  try {
    console.log('📡 Connecting to MongoDB...');
    await connectToDatabase(config.mongodbUri);
    console.log('✅ Connected to MongoDB successfully.');
  } catch (err: any) {
    console.error('⚠️ Could not connect to MongoDB:', err.message);
    console.log('👉 Please ensure MONGODB_URI in backend/.env is set to your MongoDB Atlas connection string.');
    console.log('👉 See SETUP.md for step-by-step instructions.');
  }

  // Initialize background cleanup job for expired drops
  initCleanupJob();

  // Start HTTP Server
  const server = app.listen(config.port, () => {
    console.log(`✨ Server running on http://localhost:${config.port}`);
    console.log(`🔗 Public Base URL: ${config.publicBaseUrl}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n🛑 Gracefully shutting down...');
    server.close(async () => {
      try {
        await mongoose.connection.close();
      } catch {}
      console.log('👋 Process terminated cleanly.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch(err => {
  console.error('💥 Fatal bootstrap error:', err);
  process.exit(1);
});
