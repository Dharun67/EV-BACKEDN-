import { Router } from 'express';
import DecisionLog from '../models/DecisionLog';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { approveAndExecuteDecision } from '../services/actionExecutor';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();
router.use(authenticate);

// GET /api/decisions/history
router.get('/history', authorize(['Admin', 'Support']), async (req, res, next) => {
  try {
    const { status, stationId, limit = 50 } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (stationId) filter.stationId = stationId;

    const decisions = await DecisionLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    return sendSuccess(res, decisions);
  } catch (error) {
    next(error);
  }
});

// GET /api/decisions/pending
router.get('/pending', authorize(['Admin', 'Support']), async (req, res, next) => {
  try {
    const decisions = await DecisionLog.find({ status: 'PENDING_APPROVAL' }).sort({ timestamp: -1 });
    return sendSuccess(res, decisions);
  } catch (error) {
    next(error);
  }
});

// POST /api/decisions/:id/approve
router.post('/:id/approve', authorize(['Admin']), async (req: any, res, next) => {
  try {
    const decision = await DecisionLog.findOne({ decisionId: req.params.id });
    if (!decision) return sendError(res, 'Decision not found', 404);

    const adminId = req.user._id.toString();

    await approveAndExecuteDecision(decision, adminId);
    return sendSuccess(res, decision);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
});

// POST /api/decisions/:id/reject
router.post('/:id/reject', authorize(['Admin']), async (req: any, res, next) => {
  try {
    const decision = await DecisionLog.findOne({ decisionId: req.params.id });
    if (!decision) return sendError(res, 'Decision not found', 404);

    if (decision.status !== 'PENDING_APPROVAL') {
      return sendError(res, 'Decision is not pending approval', 400);
    }

    decision.status = 'REJECTED';
    decision.approvedBy = req.user._id.toString();
    decision.approvedAt = new Date();
    await decision.save();

    return sendSuccess(res, decision);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
});

export default router;
