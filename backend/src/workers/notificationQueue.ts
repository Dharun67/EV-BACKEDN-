import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { getIo } from '../socket';

const createConnection = () => {
  const client = new IORedis(process.env.REDIS_URL || 'redis://172.18.226.127:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    family: 4,
    retryStrategy(times) {
      return Math.min(times * 1000, 5000);
    }
  });
  client.on('error', (err) => console.error('[BULLMQ REDIS] Connection Error:', err.message));
  return client;
};

export const notificationQueue = new Queue('notificationProcessing', { connection: createConnection() });
notificationQueue.on('error', () => {}); // Suppress stack trace

export const notificationWorker = new Worker('notificationProcessing', async job => {
  const { target, event, payload } = job.data;
  console.log(`[BULLMQ] Processing notification ${job.id} for ${target}`);
  
  const io = getIo();
  if (io) {
    if (target === 'ADMIN') {
      io.emit(event, payload);
    } else {
      // User targeted
      io.to(`user:${target}`).emit(event, payload);
      // We'll also just emit globally for demo purposes if the specific room fails
      io.emit(event, payload); 
    }
  } else {
    throw new Error('Socket.IO instance not available yet, will retry');
  }
  
}, { connection: createConnection(), concurrency: 10 });
notificationWorker.on('error', () => {}); // Suppress stack trace

notificationWorker.on('failed', (job, err) => {
  console.error(`[BULLMQ] Notification Job ${job?.id} failed: ${err.message}`);
});

export const addNotificationJob = async (target: string, event: string, payload: any) => {
  await notificationQueue.add('sendNotification', { target, event, payload }, {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  });
};
