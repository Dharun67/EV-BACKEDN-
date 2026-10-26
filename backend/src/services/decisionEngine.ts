import redisClient from '../config/redis';
import DecisionLog from '../models/DecisionLog';
import { executeDecision } from './actionExecutor';

export interface DecisionContext {
  eventId: string; // Unique ID for idempotency
  stationId?: string;
  chargerId?: string;
  bookingId?: string;
  queue: number;
  predictedQueue: number;
  waitingTime: number;
  predictedDemand: string; // 'Low', 'Medium', 'High', 'Very High'
  chargerAvailability: string; // 'AVAILABLE', 'OFFLINE', 'IN_USE', etc.
  chargerHealth: string; // 'GOOD', 'WARNING', 'CRITICAL'
  maintenanceRisk: string; // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  activeIncidents: any[];
  source: string;
}

export const buildDecisionContext = async (stationId: string | undefined, chargerId: string | undefined, source: string, eventId: string): Promise<DecisionContext> => {
  let queue = 0;
  let predictedQueue = 0;
  let waitingTime = 0;
  let predictedDemand = 'Low';
  let chargerAvailability = 'AVAILABLE';
  let chargerHealth = 'GOOD';
  let maintenanceRisk = 'LOW';
  let activeIncidents: any[] = [];

  try {
    if (redisClient.status === 'ready') {
      if (stationId) {
        queue = await redisClient.zcard(`queue:${stationId}`) || 0;
        const cachedDemand = await redisClient.get(`prediction:${stationId}:demand`);
        if (cachedDemand) {
          const parsed = JSON.parse(cachedDemand);
          predictedDemand = parsed.predictedLevel || 'Low';
        }
      }
      if (chargerId) {
        chargerAvailability = await redisClient.get(`charger:${chargerId}:status`) || 'AVAILABLE';
        const cachedMaint = await redisClient.get(`prediction:${chargerId}:maintenance`);
        if (cachedMaint) {
          const parsed = JSON.parse(cachedMaint);
          maintenanceRisk = parsed.riskLevel || 'LOW';
          chargerHealth = parsed.riskLevel === 'CRITICAL' ? 'CRITICAL' : (parsed.riskLevel === 'WARNING' ? 'WARNING' : 'GOOD');
        }
      }
    }
  } catch(e) {}

  return {
    eventId,
    stationId,
    chargerId,
    queue,
    predictedQueue,
    waitingTime,
    predictedDemand,
    chargerAvailability,
    chargerHealth,
    maintenanceRisk,
    activeIncidents,
    source
  };
};

export const evaluateDecision = async (context: DecisionContext) => {
  const { stationId, chargerId, eventId, source } = context;

  if (!stationId && !chargerId) {
    throw new Error('Decision context must include stationId or chargerId');
  }

  // 1. Idempotency & Concurrency Lock
  const lockKey = `decision:lock:${eventId}`;
  if (redisClient.status === 'ready') {
    const lock = await redisClient.setnx(lockKey, 'LOCKED');
    if (!lock) {
      console.log(`[DECISION ENGINE] Skipping duplicate event ${eventId}`);
      return null; // Already processing or processed
    }
    await redisClient.expire(lockKey, 60);
  }

  console.log(`[DECISION ENGINE] Evaluating context from ${source} for ${stationId || chargerId}`);

  let action = 'NO_ACTION';
  let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  let reason = 'System is operating nominally.';
  let evidence: string[] = [];

  // --- DETERMINISTIC RULE ENGINE ---

  // Rule 1: Charger Offline / Fault
  if (context.chargerAvailability === 'OFFLINE' || context.chargerHealth === 'CRITICAL') {
    action = 'MARK_CHARGER_UNAVAILABLE';
    priority = 'CRITICAL';
    reason = 'Charger is unavailable or in critical health.';
    evidence.push(`Charger Availability: ${context.chargerAvailability}`);
    evidence.push(`Charger Health: ${context.chargerHealth}`);
  }
  // Rule 2: Critical Incident Escalate
  else if (context.activeIncidents.some(i => i.severity === 'CRITICAL')) {
    action = 'ESCALATE_INCIDENT';
    priority = 'CRITICAL';
    reason = 'Critical incident detected in active incidents.';
    evidence.push(`Active Critical Incidents: ${context.activeIncidents.filter(i => i.severity === 'CRITICAL').length}`);
  }
  // Rule 3: High Queue Risk
  else if (context.queue >= 5 || context.waitingTime > 30) {
    action = 'CREATE_QUEUE_ALERT';
    priority = context.queue >= 8 ? 'CRITICAL' : 'HIGH';
    reason = 'Queue or waiting time exceeds safe thresholds.';
    evidence.push(`Current Queue: ${context.queue}`);
    evidence.push(`Estimated Wait Time: ${context.waitingTime} mins`);
  }
  // Rule 4: Predicted Capacity Shortage
  else if ((context.predictedDemand === 'High' || context.predictedDemand === 'Very High') && context.chargerAvailability === 'OFFLINE') {
    action = 'CREATE_DEMAND_ALERT';
    priority = 'HIGH';
    reason = 'High predicted demand with reduced charger availability.';
    evidence.push(`Predicted Demand: ${context.predictedDemand}`);
    evidence.push(`Charger Status: ${context.chargerAvailability}`);
  }
  // Rule 5: Maintenance Warning
  else if (context.maintenanceRisk === 'HIGH' || context.maintenanceRisk === 'CRITICAL') {
    action = 'CREATE_MAINTENANCE_ALERT';
    priority = context.maintenanceRisk === 'CRITICAL' ? 'HIGH' : 'MEDIUM';
    reason = 'Predictive maintenance flagged an elevated risk.';
    evidence.push(`Maintenance Risk: ${context.maintenanceRisk}`);
  }
  
  const decisionId = `DEC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Save to MongoDB
  const decision = new DecisionLog({
    decisionId,
    stationId,
    chargerId,
    bookingId: context.bookingId,
    action,
    priority,
    reason,
    evidence,
    source,
    status: action === 'NO_ACTION' ? 'NO_ACTION' : 'PENDING_APPROVAL', // Will be updated by executor
    executed: false
  });
  await decision.save();

  // Execute Action
  if (action !== 'NO_ACTION') {
    await executeDecision(decision);
  }

  return decision;
};
