import redisClient from '../config/redis';
import Station from '../models/Station';
import Charger from '../models/Charger';

export const initializeRedisState = async () => {
  if (redisClient.status !== 'ready') {
    console.warn('Redis is not ready. Skipping initialization.');
    return;
  }

  try {
    console.log('Initializing Redis state from MongoDB...');
    const stations = await Station.find({});
    
    for (const station of stations) {
      const chargers = await Charger.find({ stationId: station.stationId });
      
      const total = chargers.length;
      const available = chargers.filter(c => c.status === 'AVAILABLE').length;
      const occupied = chargers.filter(c => c.status === 'OCCUPIED').length;
      const faulted = chargers.filter(c => c.status === 'FAULT').length;
      const maintenance = chargers.filter(c => c.status === 'MAINTENANCE').length;
      
      const availKey = `station:${station.stationId}:availability`;
      
      await redisClient.hset(availKey, {
        totalChargers: total,
        availableChargers: available,
        occupiedChargers: occupied,
        faultedChargers: faulted,
        maintenanceChargers: maintenance
      });
      
      for (const charger of chargers) {
        await redisClient.set(`charger:${charger.chargerId}:status`, charger.status);
      }
    }
    console.log('Redis state initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Redis state:', error);
  }
};
