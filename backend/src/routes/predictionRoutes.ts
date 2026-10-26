import { Router } from 'express';
import * as mlService from '../services/mlService';
import { sendSuccess, sendError } from '../utils/apiResponse';
import AIPrediction from '../models/AIPrediction';
import { detectCapacityShortage, detectMaintenanceRequired } from '../services/incidentDetectionService';
import { addDecisionJob } from '../workers/decisionQueue';
import { buildDecisionContext } from '../services/decisionEngine';

const router = Router();
import redisClient from '../config/redis';

router.get('/queue/:stationId', async (req, res, next) => {
  try {
    const { stationId } = req.params;
    const response = await mlService.getQueuePrediction(stationId);
    
    // As per Option A, this will safely return { success: false, message: '...' }
    if (!response.success) {
      return sendError(res, response.message || 'Queue prediction service unavailable', 400);
    }
    return sendSuccess(res, response);
  } catch (error) {
    next(error);
  }
});

router.get('/waiting-time/:stationId', async (req, res, next) => {
  try {
    const { stationId } = req.params;
    const response = await mlService.getWaitingTimePrediction(stationId);
    
    if (!response.success) {
      return sendError(res, response.message || 'Waiting time prediction service unavailable', 400);
    }
    return sendSuccess(res, response);
  } catch (error) {
    next(error);
  }
});

router.get('/queue-risk/:stationId', async (req, res, next) => {
  try {
    const { stationId } = req.params;
    const response = await mlService.getQueueRiskPrediction(stationId);
    
    if (!response.success) {
      return sendError(res, response.message || 'Queue risk prediction service unavailable', 400);
    }
    return sendSuccess(res, response);
  } catch (error) {
    next(error);
  }
});

router.get('/demand/:stationId', async (req, res, next) => {
  try {
    const { stationId } = req.params;
    
    // Check Redis cache first
    if (redisClient.status === 'ready') {
      const cached = await redisClient.get(`prediction:${stationId}:demand`);
      if (cached) {
        return sendSuccess(res, JSON.parse(cached));
      }
    }
    
    const timestamp = new Date().toISOString();
    const response = await mlService.getDemandPrediction(stationId, timestamp);
    
    if (!response || !response.success) {
      return sendError(res, response?.message || 'Demand prediction service unavailable due to insufficient historical data', 400);
    }
    
    // Save to Redis (10 mins TTL)
    if (redisClient.status === 'ready') {
      await redisClient.setex(`prediction:${stationId}:demand`, 600, JSON.stringify(response));
    }
    
    // Step 31.9 Capacity Shortage detection
    if (response.predictedLevel === 'Very High' || response.predictedLevel === 'High') {
      // In a real app we'd fetch actual offline charger counts here
      detectCapacityShortage(stationId, response.predictedLevel, 2).catch(console.error);
    }
    
    // Step 32 Hook
    buildDecisionContext(stationId, undefined, 'DEMAND_PREDICTION', `DEM-${stationId}-${Date.now()}`)
      .then(ctx => {
        ctx.predictedDemand = response.predictedLevel;
        return addDecisionJob(ctx);
      }).catch(console.error);

    return sendSuccess(res, response);
  } catch (error) {
    next(error);
  }
});

router.get('/maintenance/:chargerId', async (req, res, next) => {
  try {
    const { chargerId } = req.params;
    
    if (redisClient.status === 'ready') {
      const cached = await redisClient.get(`prediction:${chargerId}:maintenance`);
      if (cached) {
        return sendSuccess(res, JSON.parse(cached));
      }
    }
    
    const response = await mlService.getMaintenancePrediction(chargerId);
    
    if (!response || !response.success) {
      return sendError(res, response?.message || 'Maintenance prediction service unavailable', 400);
    }
    
    // Cache for 30 mins
    if (redisClient.status === 'ready') {
      await redisClient.setex(`prediction:${chargerId}:maintenance`, 1800, JSON.stringify(response));
    }
    
    // Trigger Incident Detection
    if (response.riskLevel === 'CRITICAL' || response.riskLevel === 'WARNING') {
      detectMaintenanceRequired(chargerId, response.stationId, response.riskLevel, response.recommendedAction).catch(console.error);
    }
    
    // Step 32 Hook
    buildDecisionContext(response.stationId, chargerId, 'MAINTENANCE_PREDICTION', `MNT-${chargerId}-${Date.now()}`)
      .then(ctx => {
        ctx.maintenanceRisk = response.riskLevel;
        return addDecisionJob(ctx);
      }).catch(console.error);

    return sendSuccess(res, response);
  } catch (error) {
    next(error);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const { stationId, predictionType } = req.query;
    const filter: any = {};
    if (stationId) filter.targetId = stationId;
    if (predictionType) filter.type = predictionType;
    
    const predictions = await AIPrediction.find(filter)
      .sort({ timestamp: -1 })
      .limit(50);
      
    return sendSuccess(res, predictions);
  } catch (error) {
    next(error);
  }
});

router.get('/model-status', async (req, res, next) => {
  try {
    const mlHealth = await mlService.getMLHealth();
    let demandModelStatus = {
        status: "UNAVAILABLE",
        reason: "ML Service Down",
        version: "N/A"
    };
    
    if (mlHealth && mlHealth.status === 'ok' && mlHealth.models_loaded?.includes('demand')) {
       demandModelStatus = {
           status: "ACTIVE",
           reason: "Available",
           version: "1.0.0"
       };
    }

    return sendSuccess(res, {
      queueModel: {
        status: "UNAVAILABLE",
        reason: "Insufficient historical data",
        version: "N/A"
      },
      waitingTimeModel: {
        status: "UNAVAILABLE",
        reason: "Insufficient historical data",
        version: "N/A"
      },
      demandModel: demandModelStatus
    });
  } catch (error) {
    next(error);
  }
});

export default router;
