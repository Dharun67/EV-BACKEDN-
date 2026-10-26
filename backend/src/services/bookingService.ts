import { v4 as uuidv4 } from 'uuid';
import Booking, { IBooking } from '../models/Booking';
import Station from '../models/Station';
import Charger from '../models/Charger';
import redisClient from '../config/redis';
import { redisCacheService } from './redisCacheService';
import * as mlService from './mlService';
import { publishEvent } from './eventService';

export const checkFeasibility = async (stationId: string, date: string, startTime: string) => {
  // 1. Fetch ML predictions
  const queuePred = await mlService.getQueuePrediction(stationId);
  const waitPred = await mlService.getWaitingTimePrediction(stationId);

  // 2. Fetch Live State (if Redis is running)
  let liveQueueSize = 0;
  let availableChargers = 1;

  if (redisClient.status === 'ready') {
    const size = await redisClient.zcard(`queue:${stationId}`);
    liveQueueSize = size || 0;
    
    // Check charger availability
    const availData = await redisClient.hgetall(`station:${stationId}:availability`);
    let totalAvail = 0;
    for (const key in availData) {
      if (availData[key] === 'AVAILABLE') totalAvail++;
    }
    availableChargers = totalAvail > 0 ? totalAvail : 1;
  }

  const predictedQueue = queuePred?.prediction?.predictedQueue || liveQueueSize;
  const predictedWait = waitPred?.prediction?.estimatedWaitMinutes || 0;

  // Feasibility Logic:
  // If predicted wait is over 60 mins OR predicted queue is highly congested
  if (predictedWait > 60 || predictedQueue >= availableChargers * 3) {
    const alternatives = await findAlternatives(stationId);
    return {
      feasible: false,
      reason: `High congestion detected. Estimated wait is ${predictedWait} mins.`,
      alternativeStation: alternatives.length > 0 ? alternatives[0] : null
    };
  }

  return { feasible: true, reason: 'Slot available.' };
};

export const createBooking = async (data: Partial<IBooking>) => {
  if (!data.stationId || !data.chargerId || !data.date || !data.startTime) {
    throw new Error('Missing required booking fields');
  }

  const slot = data.startTime;
  const lockKey = `gridwise:booking-lock:${data.stationId}:${data.chargerId}:${slot}`;
  const lockTtl = process.env.REDIS_BOOKING_LOCK_TTL_SECONDS ? parseInt(process.env.REDIS_BOOKING_LOCK_TTL_SECONDS, 10) : 30;

  // 1. Attempt to acquire distributed lock
  const lockAcquired = await redisCacheService.set(lockKey, { userId: data.userId, timestamp: Date.now() }, lockTtl, true);
  
  if (!lockAcquired) {
    throw new Error('This charging slot is currently being booked by another user. Please try again or select another slot.');
  }

  // 1.5 Check Station Status
  const station = await Station.findOne({ stationId: data.stationId });
  if (!station || station.status !== 'Operational') {
    await redisCacheService.delete(lockKey);
    throw new Error(`Station is currently ${station?.status || 'unreachable'}. Cannot create booking.`);
  }

  // 1.6 Check DB for existing overlapping bookings
  const existingBooking = await Booking.findOne({
    stationId: data.stationId,
    chargerId: data.chargerId,
    date: data.date,
    startTime: data.startTime,
    status: 'CONFIRMED'
  });

  if (existingBooking) {
    await redisCacheService.delete(lockKey);
    throw new Error('This charging slot has already been booked in the database.');
  }

  try {
    const bookingId = `GW-B-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const booking = new Booking({
      ...data,
      bookingId,
      status: 'CONFIRMED'
    });

    // 2. Save to permanent MongoDB
    await booking.save();

    // 3. Publish Event
    await publishEvent('booking.created', {
      bookingId: booking.bookingId,
      stationId: booking.stationId,
      chargerId: booking.chargerId,
      userId: booking.userId,
      date: booking.date,
      startTime: booking.startTime
    });

    // 4. Release lock explicitly or let it TTL expire. We can release early if desired, but TTL is safe.
    await redisCacheService.delete(lockKey);

    return booking;
  } catch (error) {
    // Release lock if DB save fails
    await redisCacheService.delete(lockKey);
    throw error;
  }
};

export const getUserBookings = async (userId: string) => {
  return await Booking.find({ userId }).sort({ createdAt: -1 });
};

export const findAlternatives = async (stationId: string) => {
  const station = await Station.findOne({ stationId });
  if (!station) return [];

  // Find nearby stations (within 5km)
  const nearby = await Station.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: station.location.coordinates
        },
        $maxDistance: 5000 // 5 km
      }
    },
    stationId: { $ne: stationId },
    status: 'Operational'
  }).limit(3);

  return nearby;
};

export const autoRebook = async (bookingId: string) => {
  const oldBooking = await Booking.findOne({ bookingId });
  if (!oldBooking) throw new Error('Booking not found');

  if (oldBooking.status !== 'CONFIRMED') {
    throw new Error('Can only rebook confirmed bookings');
  }

  const alternatives = await findAlternatives(oldBooking.stationId);
  if (alternatives.length === 0) {
    throw new Error('No alternative stations found nearby');
  }

  const newStation = alternatives[0];

  // Pick a random charger from the new station (in reality, would check availability)
  const availableChargers = await Charger.find({ stationId: newStation.stationId });
  const selectedCharger = availableChargers.length > 0 ? availableChargers[0].chargerId : 'default-charger';

  const newBooking = await createBooking({
    userId: oldBooking.userId,
    stationId: newStation.stationId,
    chargerId: selectedCharger,
    date: oldBooking.date,
    startTime: oldBooking.startTime,
    durationMinutes: oldBooking.durationMinutes,
    estimatedEnergyKwh: oldBooking.estimatedEnergyKwh,
    estimatedCost: oldBooking.estimatedCost,
    rebookedFromId: oldBooking.bookingId
  });

  // Cancel old booking
  oldBooking.status = 'CANCELLED';
  await oldBooking.save();

  return newBooking;
};
