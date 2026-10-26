import Charger from '../models/Charger';
import * as mlService from './mlService';

export const getAIInsights = async () => {
  const insights = [];

  // 1. Fetch real ML insights (Demand Forecast)
  try {
    const demandForecast = await mlService.getDemandPrediction('Chennai', new Date().toISOString());
    if (demandForecast && demandForecast.success) {
      insights.push({
        type: 'DEMAND',
        source: 'ML_MODEL',
        model: demandForecast.model,
        prediction: demandForecast.prediction,
        confidence: demandForecast.metadata?.metrics?.r2 || null,
        message: `ML Forecast: Expected demand score ${demandForecast.prediction.toFixed(1)} for Chennai.`,
        severity: demandForecast.prediction > 50 ? 'HIGH' : 'NORMAL'
      });
    }
  } catch (e) {
    console.error('Failed to fetch ML demand forecast');
  }

  // 2. Fetch real ML insights (Revenue Forecast)
  try {
    const revenueForecast = await mlService.getRevenueForecast(1000, 7000, new Date().toISOString());
    if (revenueForecast && revenueForecast.success) {
      insights.push({
        type: 'REVENUE',
        source: 'ML_MODEL',
        model: revenueForecast.model,
        prediction: revenueForecast.forecast,
        confidence: revenueForecast.metadata?.metrics?.r2 || null,
        message: `ML Forecast: Expected daily revenue ₹${revenueForecast.forecast.toFixed(2)}.`,
        severity: 'NORMAL'
      });
    }
  } catch (e) {
    console.error('Failed to fetch ML revenue forecast');
  }

  // 3. Rule-based Insights (Fallback)
  const totalChargers = await Charger.countDocuments();
  const faultChargers = await Charger.countDocuments({ status: { $regex: /fault/i } });
  
  if (totalChargers > 0 && faultChargers > (totalChargers * 0.1)) {
    insights.push({
      type: 'MAINTENANCE',
      source: 'RULE-BASED',
      severity: 'CRITICAL',
      message: 'More than 10% of chargers are currently in fault state',
      note: 'ML Model unavailable — insufficient historical fault data.'
    });
  }

  insights.push({
    type: 'FLEET',
    source: 'UNAVAILABLE',
    severity: 'NORMAL',
    message: 'Fleet / Battery degradation model unavailable — insufficient historical telemetry data.'
  });

  return insights;
};
