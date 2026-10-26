import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { evaluateDecision, DecisionContext } from '../services/decisionEngine';

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

export const decisionQueue = new Queue('decisionProcessing', { connection: createConnection() });
decisionQueue.on('error', () => {}); // Suppress stack trace

export const decisionWorker = new Worker('decisionProcessing', async job => {
  const context: DecisionContext = job.data;
  console.log(`[BULLMQ] Processing decision job ${job.id} for event ${context.eventId}`);
  
  await evaluateDecision(context);
  
}, { 
  connection: createConnection(),
  concurrency: 5 
});
decisionWorker.on('error', () => {}); // Suppress stack trace

decisionWorker.on('completed', job => {
  console.log(`[BULLMQ] Decision Job ${job.id} has completed!`);
});

decisionWorker.on('failed', (job, err) => {
  console.error(`[BULLMQ] Decision Job ${job?.id} has failed with ${err.message}`);
});

export const addDecisionJob = async (context: DecisionContext) => {
  // Use eventId to prevent duplicates inside the queue itself
  const jobId = `DECISION-${context.eventId}`;
  await decisionQueue.add('processDecision', context, {
    jobId,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  });
};
