import redisClient from '../config/redis';
import { emitToStation } from '../socket';
import { getQueuePrediction, getWaitingTimePrediction } from './mlService';
import Station from '../models/Station';
import Vehicle from '../models/Vehicle';
import QueueEntry from '../models/QueueEntry';
import { v4 as uuidv4 } from 'uuid';
import { detectHighQueue } from './incidentDetectionService';
import { addDecisionJob } from '../workers/decisionQueue';
import { buildDecisionContext } from './decisionEngine';
import { publishEvent } from './eventService';

export const joinQueue = async (stationId: string, vehicleId: string, userId: string) => {
  // 1. Validations
  if (redisClient.status !== 'ready') {
    throw new Error('Real-time service temporarily unavailable.');
  }

  const station = await Station.findOne({ stationId });
  if (!station || station.status !== 'Operational') {
    throw new Error('Station is currently unavailable or offline');
  }

  const vehicle = await Vehicle.findOne({ vehicleId });
  if (!vehicle) throw new Error('Vehicle not found');

  const queueKey = `queue:${stationId}`;

  // 2. Duplicate Protection (MongoDB Check)
  let queueEntry = await QueueEntry.findOne({ userId, stationId, status: 'WAITING' });
  if (!queueEntry) {
    queueEntry = new QueueEntry({
      userId,
      stationId,
      vehicleId,
      status: 'WAITING',
      position: 0
    });
    await queueEntry.save();
  }

  // 3. Add to Redis Sorted Set (idempotent)
  const timestamp = Date.now();
  await redisClient.zadd(queueKey, timestamp, vehicleId);

  // 4. Calculate newly joined position
  const rank = await redisClient.zrank(queueKey, vehicleId);
  const position = rank !== null ? rank + 1 : 1;
  
  queueEntry.position = position;
  await queueEntry.save();

  // 5. Broadcast Event
  emitToStation(stationId, 'queue:joined', { vehicleId, position: rank, timestamp });
  emitToStation(stationId, 'queue:updated', await getQueueState(stationId));

  // 6. Publish to RabbitMQ
  await publishEvent('queue.joined', {
    stationId,
    vehicleId,
    timestamp,
    position: rank
  });

  return getQueueState(stationId, vehicleId, rank);
};

export const leaveQueue = async (stationId: string, vehicleId: string) => {
  if (redisClient.status !== 'ready') {
    throw new Error('Real-time service temporarily unavailable.');
  }
  const queueKey = `queue:${stationId}`;
  
  await redisClient.zrem(queueKey, vehicleId);
  
  // Update DB state
  await QueueEntry.updateMany(
    { stationId, vehicleId, status: 'WAITING' },
    { $set: { status: 'LEFT', lastUpdatedAt: new Date() } }
  );

  const remainingSize = await redisClient.zcard(queueKey);
  
  emitToStation(stationId, 'queue:left', { vehicleId });
  emitToStation(stationId, 'queue:updated', await getQueueState(stationId));

  await publishEvent('queue.left', {
    stationId,
    vehicleId,
    timestamp: Date.now()
  });

  return { success: true, remainingSize };
};

export const getQueueState = async (stationId: string, targetVehicleId?: string, targetRank?: number | null) => {
  if (redisClient.status !== 'ready') {
    throw new Error('Real-time service temporarily unavailable.');
  }

  const queueKey = `queue:${stationId}`;
  const queueLength = await redisClient.zcard(queueKey);
  
  // Try to use ML prediction for waiting time, cache it in Redis
  const cacheKey = `prediction:${stationId}:waiting-time`;
  let estimatedWait = 0;
  
  const cachedWait = await redisClient.get(cacheKey);
  if (cachedWait) {
    estimatedWait = parseInt(cachedWait, 10);
  } else {
    // If not cached, call ML service
    const mlResponse = await getWaitingTimePrediction(stationId);
    if (mlResponse && mlResponse.success && mlResponse.estimatedWaitingTime) {
      estimatedWait = mlResponse.estimatedWaitingTime;
      await redisClient.set(cacheKey, estimatedWait.toString(), 'EX', 300); // 5 min TTL
      
      // Step 31.8 Trigger incident detection
      if (queueLength >= 5) {
        detectHighQueue(stationId, queueLength, mlResponse.predictedQueueLength || queueLength, estimatedWait).catch(console.error);
      }
    } else {
      // Fallback calculation: (Queue Length / Chargers) * Avg charge time
      // This is a naive calculation just to provide a realistic number
      const availabilityStr = await redisClient.hgetall(`station:${stationId}:availability`);
      const totalChargers = availabilityStr?.totalChargers ? parseInt(availabilityStr.totalChargers) : 4;
      estimatedWait = queueLength > 0 ? Math.round((queueLength / totalChargers) * 30) : 0;
      
      if (queueLength >= 5) {
        detectHighQueue(stationId, queueLength, queueLength, estimatedWait).catch(console.error);
      }
    }
  }

  // Hook into AI Decision Engine
  try {
    const context = await buildDecisionContext(stationId, undefined, 'QUEUE_SERVICE', `Q-${stationId}-${Date.now()}`);
    context.queue = queueLength;
    context.waitingTime = estimatedWait;
    addDecisionJob(context).catch(console.error);
  } catch (err) {
    console.error('[QUEUE] Failed to trigger decision engine', err);
  }

  // Get position if requested
  let position = targetRank !== undefined ? targetRank : null;
  if (targetVehicleId && position === null) {
    position = await redisClient.zrank(queueKey, targetVehicleId);
  }

  let queueEntryId = null;
  if (targetVehicleId) {
    const entry = await QueueEntry.findOne({ stationId, vehicleId: targetVehicleId, status: 'WAITING' });
    if (entry) queueEntryId = entry.queueEntryId;
  }

  return {
    success: true,
    stationId,
    vehicleId: targetVehicleId,
    queueEntryId,
    position: position !== null ? (position + 1) : null, // zrank is 0-indexed
    queueLength,
    estimatedWaitingTime: targetVehicleId && position !== null ? (estimatedWait * ((position+1) / queueLength)) : estimatedWait,
    status: 'WAITING',
    lastUpdated: new Date().toISOString()
  };
};

export const getQueueSize = async (stationId: string) => {
  if (redisClient.status !== 'ready') {
    throw new Error('Real-time service temporarily unavailable.');
  }
  const queueKey = `queue:${stationId}`;
  const length = await redisClient.zcard(queueKey);
  return length;
};

export const startSession = async (stationId: string, vehicleId: string, chargerId: string) => {
  if (redisClient.status !== 'ready') {
    throw new Error('Real-time service temporarily unavailable.');
  }
  
  // 1. Remove from queue
  await leaveQueue(stationId, vehicleId);
  
  // 2. Update Charger Status in Redis
  await redisClient.set(`charger:${chargerId}:status`, 'OCCUPIED');
  
  // 3. Update Station Availability
  const availKey = `station:${stationId}:availability`;
  await redisClient.hincrby(availKey, 'availableChargers', -1);
  await redisClient.hincrby(availKey, 'occupiedChargers', 1);
  
  // 4. Record queue history snapshot (as requested in Step 27.26)
  import('../models/QueueHistory').then(async ({ default: QueueHistory }) => {
    const queueLength = await getQueueSize(stationId);
    const availability = await redisClient.hgetall(availKey);
    const state = await getQueueState(stationId);
    
    await QueueHistory.create({
      stationId,
      queueLength,
      availableChargers: parseInt(availability.availableChargers || '0'),
      occupiedChargers: parseInt(availability.occupiedChargers || '0'),
      waitingTime: state.estimatedWaitingTime,
      source: 'live_observation'
    });
  });
  
  // 5. Broadcast updates
  emitToStation(stationId, 'charger:statusChanged', { chargerId, status: 'OCCUPIED' });
  emitToStation(stationId, 'session:started', { vehicleId, chargerId });
  emitToStation(stationId, 'station:availabilityChanged', await redisClient.hgetall(availKey));
  
  return { success: true, message: 'Session started successfully' };
};

export const endSession = async (stationId: string, vehicleId: string, chargerId: string) => {
  if (redisClient.status !== 'ready') {
    throw new Error('Real-time service temporarily unavailable.');
  }
  
  // 1. Make charger available
  await redisClient.set(`charger:${chargerId}:status`, 'AVAILABLE');
  
  // 2. Update availability
  const availKey = `station:${stationId}:availability`;
  await redisClient.hincrby(availKey, 'availableChargers', 1);
  await redisClient.hincrby(availKey, 'occupiedChargers', -1);
  
  // 3. Broadcast
  emitToStation(stationId, 'charger:statusChanged', { chargerId, status: 'AVAILABLE' });
  emitToStation(stationId, 'session:ended', { vehicleId, chargerId });
  emitToStation(stationId, 'station:availabilityChanged', await redisClient.hgetall(availKey));
  
  return { success: true, message: 'Session ended successfully' };
};

