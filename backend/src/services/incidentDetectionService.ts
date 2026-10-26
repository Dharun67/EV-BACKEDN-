import Incident from '../models/Incident';
import { addIncidentJob } from '../workers/incidentQueue';
import { addDecisionJob } from '../workers/decisionQueue';
import { buildDecisionContext } from './decisionEngine';
import { publishEvent } from './eventService';

export const detectChargerFault = async (chargerId: string, stationId: string, details: string, source: string = 'SYSTEM') => {
  console.log(`[INCIDENT DETECTION] Detecting CHARGER_FAULT for ${chargerId} at ${stationId}`);
  
  // Deduplication check (Step 31.24)
  const existing = await Incident.findOne({
    type: 'CHARGER_FAULT',
    chargerId,
    status: { $in: ['OPEN', 'INVESTIGATING', 'ACTION_REQUIRED'] }
  });
  
  if (existing) {
    console.log(`[INCIDENT DETECTION] Deduplication active. Active CHARGER_FAULT already exists for ${chargerId}. Skipping creation.`);
    return existing;
  }
  
  // Push to BullMQ to process creation and automation asynchronously
  await addIncidentJob({
    chargerId,
    stationId,
    eventType: 'CHARGER_FAULT',
    severity: 'CRITICAL',
    details,
    source
  });
  
  await publishEvent('incident.created', {
    chargerId,
    stationId,
    eventType: 'CHARGER_FAULT',
    severity: 'CRITICAL',
    source
  });

  return { success: true, queued: true };
};

export const detectHighQueue = async (stationId: string, currentQueue: number, predictedQueue: number, estimatedWaitTime: number) => {
  // Step 31.8
  // If queue risk becomes HIGH/CRITICAL (e.g. > 5)
  if (currentQueue < 5 && predictedQueue < 5) return null;
  
  const existing = await Incident.findOne({
    type: 'HIGH_QUEUE',
    stationId,
    status: { $in: ['OPEN', 'INVESTIGATING', 'ACTION_REQUIRED'] }
  });
  
  if (existing) return existing;
  
  await addIncidentJob({
    stationId,
    eventType: 'HIGH_QUEUE',
    severity: currentQueue >= 8 ? 'CRITICAL' : 'HIGH',
    details: `High Queue detected. Current: ${currentQueue}, Predicted: ${predictedQueue}, Est Wait: ${estimatedWaitTime} mins.`,
    source: 'ML_SERVICE',
    relatedPrediction: { currentQueue, predictedQueue, estimatedWaitTime }
  });
  
  await publishEvent('incident.created', {
    stationId,
    eventType: 'HIGH_QUEUE',
    severity: currentQueue >= 8 ? 'CRITICAL' : 'HIGH',
    source: 'ML_SERVICE'
  });

  return { success: true, queued: true };
};

export const detectCapacityShortage = async (stationId: string, predictedDemandLevel: string, offlineChargers: number) => {
  // Step 31.9
  if (predictedDemandLevel !== 'Very High' && predictedDemandLevel !== 'High') return null;
  if (offlineChargers < 2) return null; // Rule: High demand + multiple chargers offline
  
  const existing = await Incident.findOne({
    type: 'PREDICTED_CAPACITY_SHORTAGE',
    stationId,
    status: { $in: ['OPEN', 'INVESTIGATING', 'ACTION_REQUIRED'] }
  });
  
  if (existing) return existing;
  
  await addIncidentJob({
    stationId,
    eventType: 'PREDICTED_CAPACITY_SHORTAGE',
    severity: 'HIGH',
    details: `Capacity Shortage Risk. Demand is ${predictedDemandLevel} and ${offlineChargers} chargers are offline.`,
    source: 'ML_SERVICE'
  });
  
  await publishEvent('incident.created', {
    stationId,
    eventType: 'PREDICTED_CAPACITY_SHORTAGE',
    severity: 'HIGH',
    source: 'ML_SERVICE'
  });

  return { success: true, queued: true };
};

export const detectMaintenanceRequired = async (chargerId: string, stationId: string, riskLevel: string, recommendedAction: string) => {
  if (riskLevel !== 'CRITICAL' && riskLevel !== 'WARNING') return null;
  
  const existing = await Incident.findOne({
    type: 'MAINTENANCE_REQUIRED',
    chargerId,
    status: { $in: ['OPEN', 'INVESTIGATING', 'ACTION_REQUIRED'] }
  });
  
  if (existing) return existing;
  
  await addIncidentJob({
    chargerId,
    stationId,
    eventType: 'MAINTENANCE_REQUIRED',
    severity: riskLevel === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
    details: `Predictive maintenance flag. Risk: ${riskLevel}. Recommended Action: ${recommendedAction}`,
    source: 'ML_SERVICE'
  });
  
  return { success: true, queued: true };
};

// Main BullMQ handler that processes the job from the queue
export const handleIncident = async (chargerId: string | undefined, stationId: string | undefined, eventType: string, severity: string, details: string, source: string) => {
  // Double-check deduplication inside the worker (in case of race conditions)
  const query: any = {
    type: eventType,
    status: { $in: ['OPEN', 'INVESTIGATING', 'ACTION_REQUIRED'] }
  };
  if (chargerId) query.chargerId = chargerId;
  if (stationId) query.stationId = stationId;

  const existing = await Incident.findOne(query);
  
  if (existing) return existing;

  const incident = new Incident({
    incidentId: `INC-${Date.now()}`,
    chargerId,
    stationId,
    type: eventType,
    severity,
    status: 'OPEN',
    description: details,
    source
  });
  
  await incident.save();
  console.log(`[INCIDENT DETECTION] Created incident ${incident.incidentId}`);
  
  // Hand off to automation engine (Step 31)
  const { processIncidentAutomation } = await import('./incidentAutomationService');
  await processIncidentAutomation(incident);
  
  // Step 32 Hook
  try {
    const ctx = await buildDecisionContext(stationId, chargerId, 'INCIDENT_DETECTION', `INC-DEC-${incident.incidentId}`);
    ctx.activeIncidents = [incident];
    await addDecisionJob(ctx);
  } catch(e) {
    console.error('[INCIDENT] Failed to trigger decision engine', e);
  }

  return incident;
};
