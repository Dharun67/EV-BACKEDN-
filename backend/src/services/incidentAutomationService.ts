import redisClient from '../config/redis';
import * as bookingService from './bookingService';
import { IIncident } from '../models/Incident';
import AuditLog from '../models/AuditLog';
import { addNotificationJob } from '../workers/notificationQueue';

export const processIncidentAutomation = async (incident: IIncident) => {
  console.log(`[AUTOMATION ENGINE] Processing incident ${incident.incidentId}`);
  
  if (incident.severity === 'CRITICAL' && incident.type === 'CHARGER_FAULT') {
    await executeCriticalChargerFault(incident);
  } else if (incident.type === 'HIGH_QUEUE') {
    await executeHighQueueAutomation(incident);
  } else if (incident.type === 'PREDICTED_CAPACITY_SHORTAGE') {
    await executeCapacityShortageAutomation(incident);
  } else if (incident.type === 'MAINTENANCE_REQUIRED') {
    await executeMaintenanceAutomation(incident);
  }
};

const recordAudit = async (action: string, resource: string, resourceId: string, result: 'SUCCESS' | 'FAILURE' | 'PENDING_APPROVAL', reason?: string) => {
  const log = new AuditLog({
    actor: 'SYSTEM',
    action,
    resource,
    resourceId,
    result,
    reason
  });
  await log.save();
};

const executeCriticalChargerFault = async (incident: IIncident) => {
  const { chargerId, stationId } = incident;
  if (!chargerId || !stationId) return;

  // 1. Mark Charger Unavailable (Safe action)
  if (redisClient.status === 'ready') {
    await redisClient.setex(`charger:${chargerId}:status`, 86400, 'OFFLINE');
    await recordAudit('MARK_CHARGER_UNAVAILABLE', 'Charger', chargerId, 'SUCCESS', 'Critical hardware fault detected');
  }

  // 2. Notify Admin via BullMQ
  await addNotificationJob('ADMIN', 'notification:admin', {
    incidentId: incident.incidentId,
    chargerId,
    stationId,
    issue: incident.description,
    priority: 'CRITICAL',
    action: 'Charger disabled automatically'
  });

  // 3. Find Alternative Station
  let alternativeStation = null;
  try {
    const alternatives = await bookingService.findAlternatives(stationId);
    if (alternatives && alternatives.length > 0) {
      alternativeStation = alternatives[0];
      await recordAudit('FIND_ALTERNATIVE_STATION', 'Station', alternativeStation.stationId, 'SUCCESS');
    }
  } catch (err) {}

  // 4. Notify Users / Re-route
  await addNotificationJob('GLOBAL', 'incident:user-reroute', {
    affectedChargerId: chargerId,
    affectedStationId: stationId,
    issue: incident.description,
    alternativeStation: alternativeStation ? {
      stationId: alternativeStation.stationId,
      name: alternativeStation.name || alternativeStation.stationId,
    } : null
  });
  await recordAudit('NOTIFY_USER', 'Booking', chargerId, 'SUCCESS', 'Broadcasted reroute to active users');

  // 5. Require Human Approval for permanent deactivation
  incident.status = 'ACTION_REQUIRED';
  incident.automatedAction = 'MARK_CHARGER_UNAVAILABLE (Temp), REROUTE_USERS';
  await incident.save();
  await recordAudit('PERMANENT_DEACTIVATION', 'Charger', chargerId, 'PENDING_APPROVAL', 'Requires admin review');
};

const executeHighQueueAutomation = async (incident: IIncident) => {
  await addNotificationJob('ADMIN', 'notification:admin', {
    incidentId: incident.incidentId,
    stationId: incident.stationId,
    issue: incident.description,
    priority: incident.severity,
    action: 'Queue management recommended'
  });
  
  incident.status = 'INVESTIGATING';
  incident.automatedAction = 'NOTIFY_ADMIN, FLAG_QUEUE';
  await incident.save();
};

const executeCapacityShortageAutomation = async (incident: IIncident) => {
  await addNotificationJob('ADMIN', 'capacity:warning', {
    incidentId: incident.incidentId,
    stationId: incident.stationId,
    issue: incident.description,
    priority: 'HIGH'
  });
  
  incident.status = 'INVESTIGATING';
  incident.automatedAction = 'NOTIFY_ADMIN';
  await incident.save();
};

const executeMaintenanceAutomation = async (incident: IIncident) => {
  await addNotificationJob('ADMIN', 'maintenance:required', {
    incidentId: incident.incidentId,
    chargerId: incident.chargerId,
    stationId: incident.stationId,
    issue: incident.description,
    priority: incident.severity
  });
  
  incident.status = 'OPEN';
  incident.automatedAction = 'CREATE_MAINTENANCE_ALERT';
  await incident.save();
};
