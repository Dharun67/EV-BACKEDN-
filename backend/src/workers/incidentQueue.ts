import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { handleIncident } from '../services/incidentDetectionService';

// BullMQ requires maxRetriesPerRequest to be null
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

export const incidentQueue = new Queue('incidentProcessing', { connection: createConnection() });
incidentQueue.on('error', () => {}); // Suppress stack trace

// Define the worker
export const incidentWorker = new Worker('incidentProcessing', async job => {
  const incidentData = job.data;
  console.log(`[BULLMQ] Processing incident job ${job.id} for station ${incidentData.stationId}`);
  
  await handleIncident(incidentData);
  
}, { 
  connection: createConnection(),
  concurrency: 3 
});
incidentWorker.on('error', () => {}); // Suppress stack trace

incidentWorker.on('completed', job => {
  console.log(`[BULLMQ] Job ${job.id} has completed!`);
});

incidentWorker.on('failed', (job, err) => {
  console.error(`[BULLMQ] Job ${job?.id} has failed with ${err.message}`);
});

export const addIncidentJob = async (data: any) => {
  // Use a jobId based on chargerId and type to enforce simple job deduplication
  const jobId = `${data.chargerId}-${data.eventType}-${Date.now()}`;
  await incidentQueue.add('processIncident', data, {
    jobId,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  });
};
