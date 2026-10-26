import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://172.18.226.127:6379';
console.log('[REDIS CONFIG] Connecting to:', REDIS_URL.replace(/:([^:@]{6})[^:@]*@/, ':$1***@')); // mask password

// We use lazyConnect so it doesn't crash on startup if Redis is down
const redisClient = new Redis(REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  family: 4,
  retryStrategy(times) {
    // Reconnect after 2 seconds, max 5 times, then stop
    if (times > 5) {
      return null;
    }
    return 2000;
  },
  enableOfflineQueue: false
});

redisClient.on('connect', () => {
  console.log('Redis connected successfully.');
});

redisClient.on('ready', () => {
  console.log('Redis is ready to receive commands.');
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

redisClient.on('close', () => {
  console.warn('Redis connection closed.');
});

redisClient.on('reconnecting', () => {
  console.log('Redis reconnecting...');
});

// Explicit connect function
export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error: any) {
    console.error('Failed to connect to Redis on startup:', error.message);
    // We swallow the error so Node doesn't crash.
    // Real-time features will just gracefully degrade.
  }
};

export default redisClient;
