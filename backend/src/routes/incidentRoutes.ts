import { Router } from 'express';
import { detectChargerFault } from '../services/incidentDetectionService';
import Incident from '../models/Incident';
import AuditLog from '../models/AuditLog';
import { sendSuccess, sendError } from '../utils/apiResponse';
import redisClient from '../config/redis';
import { emitToStation } from '../socket';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();
router.use(authenticate);

// GET /api/incidents
router.get('/', async (req, res, next) => {
  try {
    const { stationId, chargerId, severity, type, status } = req.query;
    const filter: any = {};
    if (stationId) filter.stationId = stationId;
    if (chargerId) filter.chargerId = chargerId;
    if (severity) filter.severity = severity;
    if (type) filter.type = type;
    if (status) filter.status = status;
    
    const incidents = await Incident.find(filter).sort({ detectedAt: -1 });
    return sendSuccess(res, incidents);
  } catch (error) {
    next(error);
  }
});

// GET /api/incidents/:incidentId
router.get('/:incidentId', async (req, res, next) => {
  try {
    const incident = await Incident.findOne({ incidentId: req.params.incidentId });
    if (!incident) return sendError(res, 'Incident not found', 404);
    return sendSuccess(res, incident);
  } catch (error) {
    next(error);
  }
});

// POST /api/incidents (Manual creation)
router.post('/', authorize(['Admin', 'Support', 'Fleet Manager', 'CPO Manager']), async (req, res, next) => {
  try {
    const { chargerId, stationId, eventType, severity, details } = req.body;
    if (!chargerId || !stationId || !severity) {
      return sendError(res, 'Missing required fields', 400);
    }
    
    // Default to triggering charger fault logic for manual POSTs
    const result = await detectChargerFault(chargerId, stationId, details || 'Manual fault', 'USER');
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

// POST /api/incidents/simulate
router.post('/simulate', authorize(['Admin']), async (req, res, next) => {
  try {
    const { chargerId, stationId, eventType, severity, details } = req.body;
    if (!chargerId || !stationId) return sendError(res, 'Missing required fields', 400);

    const result = await detectChargerFault(chargerId, stationId, details || 'Simulated fault', 'SYSTEM');
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/incidents/:incidentId
router.patch('/:incidentId', authorize(['Admin', 'Support']), async (req, res, next) => {
  try {
    const incident = await Incident.findOneAndUpdate(
      { incidentId: req.params.incidentId },
      { $set: req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!incident) return sendError(res, 'Incident not found', 404);
    return sendSuccess(res, incident);
  } catch (error) {
    next(error);
  }
});

// POST /api/incidents/:incidentId/resolve
router.post('/:incidentId/resolve', authorize(['Admin', 'Support']), async (req, res, next) => {
  try {
    const incident = await Incident.findOne({ incidentId: req.params.incidentId });
    if (!incident) return sendError(res, 'Incident not found', 404);

    incident.status = 'RESOLVED';
    incident.resolvedAt = new Date();
    await incident.save();

    // Revert state safely
    if (incident.chargerId && redisClient.status === 'ready') {
      await redisClient.set(`charger:${incident.chargerId}:status`, 'AVAILABLE');
      emitToStation(incident.stationId || 'GLOBAL', 'charger:statusChanged', { chargerId: incident.chargerId, status: 'AVAILABLE' });
    }

    emitToStation(incident.stationId || 'GLOBAL', 'incident:resolved', incident);

    const log = new AuditLog({
      actor: 'ADMIN',
      action: 'RESOLVE_INCIDENT',
      resource: 'Incident',
      resourceId: incident.incidentId,
      result: 'SUCCESS'
    });
    await log.save();

    return sendSuccess(res, incident);
  } catch (error) {
    next(error);
  }
});

// POST /api/incidents/:incidentId/approve-action
router.post('/:incidentId/approve-action', authorize(['Admin']), async (req, res, next) => {
  try {
    const incident = await Incident.findOne({ incidentId: req.params.incidentId });
    if (!incident) return sendError(res, 'Incident not found', 404);

    if (incident.status !== 'ACTION_REQUIRED') {
      return sendError(res, 'No action required for this incident', 400);
    }

    incident.status = 'INVESTIGATING'; // Move forward
    await incident.save();

    // Log the manual human approval
    const log = new AuditLog({
      actor: 'ADMIN',
      action: 'APPROVE_AUTOMATION_ACTION',
      resource: 'Incident',
      resourceId: incident.incidentId,
      result: 'SUCCESS',
      reason: 'Admin approved permanent deactivation'
    });
    await log.save();

    // For the demo, we would then execute the hard permanent deactivation script here...
    
    return sendSuccess(res, incident);
  } catch (error) {
    next(error);
  }
});

export default router;
