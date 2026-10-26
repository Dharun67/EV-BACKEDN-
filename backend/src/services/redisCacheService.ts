import redisClient from '../config/redis';

const DEFAULT_TTL = process.env.REDIS_DEFAULT_TTL_SECONDS ? parseInt(process.env.REDIS_DEFAULT_TTL_SECONDS, 10) : 300;

class RedisCacheService {
  /**
   * Retrieves a value from the cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (redisClient.status !== 'ready') return null;
    try {
      const data = await redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      console.warn(`[RedisCache] Failed to get key ${key}:`, error);
      return null;
    }
  }

  /**
   * Sets a value in the cache with an optional TTL
   */
  async set(key: string, value: any, ttlSeconds: number = DEFAULT_TTL, nx: boolean = false): Promise<boolean> {
    if (redisClient.status !== 'ready') return false;
    try {
      const serializedValue = JSON.stringify(value);
      if (nx) {
        const result = await redisClient.set(key, serializedValue, 'EX', ttlSeconds, 'NX');
        return result === 'OK';
      } else {
        await redisClient.setex(key, ttlSeconds, serializedValue);
        return true;
      }
    } catch (error) {
      console.warn(`[RedisCache] Failed to set key ${key}:`, error);
      return false;
    }
  }

  /**
   * Deletes a value from the cache
   */
  async delete(key: string): Promise<boolean> {
    if (redisClient.status !== 'ready') return false;
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.warn(`[RedisCache] Failed to delete key ${key}:`, error);
      return false;
    }
  }

  /**
   * Checks if a key exists
   */
  async exists(key: string): Promise<boolean> {
    if (redisClient.status !== 'ready') return false;
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.warn(`[RedisCache] Failed to check existence of key ${key}:`, error);
      return false;
    }
  }
}

export const redisCacheService = new RedisCacheService();
