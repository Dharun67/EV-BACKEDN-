import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import AIPrediction from '../models/AIPrediction';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8001';

const mlClient = axios.create({
  baseURL: ML_API_URL,
  timeout: 5000, // 5 seconds max wait for ML predictions
});

export const getDemandPrediction = async (stationId: string, timestamp: string) => {
  try {
    const response = await mlClient.post(`${ML_API_URL}/predict/demand`, { stationId, timestamp });
    const data = response.data;
    
    // Log to DB
    await AIPrediction.create({
      predictionId: uuidv4(),
      type: 'DEMAND',
      targetId: stationId,
      prediction: data.predictedDemand,
      aiModel: data.modelVersion || '1.0',
      modelVersion: data.modelVersion || '1.0.0',
      timestamp: new Date(),
      featuresUsed: { stationId, timestamp, demandLevel: data.demandLevel }
    });
    
    return data;
  } catch (error: any) {
    console.error("ML Service Error (Demand):", error.message);
    return null;
  }
};

export const getRevenueForecast = async (lag_1: number, lag_7: number, target_date: string) => {
  try {
    const response = await mlClient.post(`${ML_API_URL}/predict/revenue`, { lag_1_revenue: lag_1, lag_7_revenue: lag_7, target_date });
    const data = response.data;
    
    await AIPrediction.create({
      predictionId: uuidv4(),
      type: 'REVENUE',
      prediction: data.forecast,
      aiModel: data.model,
      modelVersion: data.metadata?.version || '1.0.0',
      timestamp: new Date(),
      featuresUsed: { lag_1, lag_7, target_date }
    });
    
    return data;
  } catch (error: any) {
    console.error("ML Service Error (Revenue):", error.message);
    return null;
  }
};

export const getStationOpportunity = async (power: number, utilization: number, zone: string) => {
  try {
    const response = await mlClient.post(`${ML_API_URL}/predict/station-opportunity`, { powerCapacityKw: power, utilization, zone });
    const data = response.data;
    
    await AIPrediction.create({
      predictionId: uuidv4(),
      type: 'STATION_OPPORTUNITY',
      targetId: zone,
      prediction: data.opportunityScore,
      aiModel: data.model,
      modelVersion: data.metadata?.version || '1.0.0',
      timestamp: new Date(),
      featuresUsed: { power, utilization, zone }
    });
    
    return data;
  } catch (error: any) {
    console.error("ML Service Error (Opportunity):", error.message);
    return null;
  }
};

export const getMLHealth = async () => {
  try {
    const response = await mlClient.get(`${ML_API_URL}/health`);
    return response.data;
  } catch (error) {
    return { status: 'down', models_loaded: [] };
  }
};

export const getQueuePrediction = async (stationId: string) => {
  try {
    const response = await mlClient.post(`${ML_API_URL}/predict/queue`, { stationId });
    return response.data;
  } catch (error: any) {
    console.error('ML Service Error (Queue):', error.message);
    return { success: false, message: 'Queue prediction service unavailable due to insufficient historical data' };
  }
};

export const getWaitingTimePrediction = async (stationId: string) => {
  try {
    const response = await mlClient.post(`${ML_API_URL}/predict/waiting-time`, { stationId });
    return response.data;
  } catch (error: any) {
    console.error('ML Service Error (WaitingTime):', error.message);
    return { success: false, message: 'Waiting-time prediction service unavailable due to insufficient historical data' };
  }
};

export const getQueueRiskPrediction = async (stationId: string) => {
  try {
    const response = await mlClient.post(`${ML_API_URL}/predict/queue-risk`, { stationId });
    return response.data;
  } catch (error: any) {
    console.error('ML Service Error (QueueRisk):', error.message);
    return { success: false, message: 'Queue risk prediction service unavailable due to insufficient historical data' };
  }
};

export const getMaintenancePrediction = async (chargerId: string) => {
  try {
    const response = await mlClient.post(`${ML_API_URL}/predict/maintenance`, { chargerId });
    const data = response.data;
    
    if (data.success) {
      await AIPrediction.create({
        predictionId: uuidv4(),
        type: 'MAINTENANCE',
        targetId: chargerId,
        prediction: data.healthScore,
        aiModel: 'Unsupervised_Charger_Health_Scoring',
        modelVersion: data.modelVersion || '1.0.0',
        timestamp: new Date(),
        featuresUsed: { chargerId, riskLevel: data.riskLevel, recommendedAction: data.recommendedAction }
      });
    }
    
    return data;
  } catch (error: any) {
    console.error("ML Service Error (Maintenance):", error.message);
    return null;
  }
};
