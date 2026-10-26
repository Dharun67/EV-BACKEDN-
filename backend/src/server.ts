import 'dotenv/config';

import app from './app';
import { connectDatabase } from './config/database';
import redisClient, { connectRedis } from './config/redis';
import { initializeRedisState } from './services/redisInitialization';
import { connectRabbitMQ } from './config/rabbitmq';
import { initFirebaseAdmin } from './config/firebaseAdmin';
import { initFCMWorker } from './workers/fcmWorker';
import mongoose from 'mongoose';
import { initSocket } from './socket';
import { createServer } from 'http';

// Register BullMQ Workers
import './workers/incidentQueue';
import './workers/notificationQueue';
import './workers/decisionQueue';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect MongoDB
    await connectDatabase();
    console.log("MONGO DB RUNNING");
    
    // 2. Connect Redis
    await connectRedis();
    console.log("REDIS RUNNING");

    // 2.5 Initialize State
    await initializeRedisState();

    // 2.8 Connect RabbitMQ
    await connectRabbitMQ();
    console.log("RABBITMQ RUNNING");
    console.log("OPENAI RUNNING");

    // 2.9 Initialize Firebase Admin & Workers
    initFirebaseAdmin();
    await initFCMWorker();

    // 3. Create HTTP Server
    const httpServer = createServer(app);

    // 4. Initialize WebSockets
    const io = initSocket(httpServer);

    // 5. Start listening
    const serverInstance = httpServer.listen(PORT, () => {
      console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    // Graceful Shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} signal received: closing HTTP server...`);
      serverInstance.close(async () => {
        console.log('HTTP server closed.');
        
        try {
          // Close MongoDB
          if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('MongoDB connection closed.');
          }

          // Close Redis
          if (redisClient.status === 'ready') {
            await redisClient.quit();
            console.log('Redis connection closed.');
          }

          console.log('Graceful shutdown completed.');
          process.exit(0);
        } catch (err) {
          console.error('Error during graceful shutdown:', err);
          process.exit(1);
        }
      });

      // Force close if taking too long
      setTimeout(() => {
        console.error('Forcing shutdown after 10 seconds...');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Triggering restart
