import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendSuccess, sendError } from '../utils/apiResponse';
import redisClient from '../config/redis';
import { v4 as uuidv4 } from 'uuid';

export const requestRescue = async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, batteryLevel } = req.body;
    const userId = req.user._id.toString();

    if (!lat || !lng) {
      return sendError(res, 'Location is required to dispatch rescue.', 400);
    }

    // In a real scenario, we'd query MongoDB/Redis for active Mobile Units nearby.
    // For now, we simulate finding one.
    
    // Calculate a simulated distance and ETA based on proximity
    const simulatedDistanceKm = (Math.random() * 5 + 1).toFixed(1); // 1.0 to 6.0 km
    const simulatedEtaMinutes = Math.floor(parseFloat(simulatedDistanceKm) * 2.5); // roughly 2.5 mins per km
    const cost = Math.floor(500 + parseFloat(simulatedDistanceKm) * 50); // Base 500 + 50/km

    const rescueSession = {
      rescueId: `RES-${uuidv4().substring(0, 8).toUpperCase()}`,
      userId,
      status: 'DISPATCHED',
      unitId: `Mobile Unit #${Math.floor(Math.random() * 90) + 10}`,
      distanceKm: simulatedDistanceKm,
      etaMinutes: simulatedEtaMinutes,
      cost,
      chargerType: 'DC Fast Charge (Mobile)',
      dispatchedAt: new Date().toISOString()
    };

    // Store active rescue session in Redis (expires in 2 hours)
    if (redisClient.status === 'ready') {
      await redisClient.setex(`rescue:${userId}`, 7200, JSON.stringify(rescueSession));
    }

    // Simulate search delay for dramatic effect in UI before returning success
    setTimeout(() => {
      sendSuccess(res, rescueSession);
    }, 1500);

  } catch (error: any) {
    console.error('Rescue Request Error:', error);
    sendError(res, 'Failed to dispatch rescue unit.', 500);
  }
};

export const getRescueStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id.toString();

    if (redisClient.status === 'ready') {
      const data = await redisClient.get(`rescue:${userId}`);
      if (data) {
        return sendSuccess(res, JSON.parse(data));
      }
    }

    return sendSuccess(res, null); // No active rescue
  } catch (error: any) {
    console.error('Rescue Status Error:', error);
    sendError(res, 'Failed to retrieve rescue status.', 500);
  }
};
