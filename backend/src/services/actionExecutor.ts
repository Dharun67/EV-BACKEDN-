import { IDecisionLog } from '../models/DecisionLog';
import AuditLog from '../models/AuditLog';
import { getIo } from '../socket';

export const executeDecision = async (decision: IDecisionLog) => {
  console.log(`[ACTION EXECUTOR] Executing action: ${decision.action} for ${decision.decisionId}`);

  let requiresAdminApproval = false;
  
  // 1. Safety Checks (Determine if sensitive)
  if (decision.action === 'MARK_CHARGER_UNAVAILABLE' || decision.action === 'ESCALATE_INCIDENT') {
    requiresAdminApproval = true;
  }

  if (requiresAdminApproval) {
    decision.status = 'PENDING_APPROVAL';
    await decision.save();
    
    // Notify Frontend
    const io = getIo();
    io.emit('decision:approvalRequired', decision);
    
    await recordAudit(decision, 'SYSTEM', 'PENDING_APPROVAL', 'Safety check: Action requires manual approval');
    return;
  }

  // 2. Execute Safe Actions
  try {
    if (decision.action === 'CREATE_QUEUE_ALERT' || decision.action === 'CREATE_DEMAND_ALERT' || decision.action === 'CREATE_MAINTENANCE_ALERT') {
      // These just need to go to the frontend dashboard, and maybe to the Incident DB if critical.
      // For now, emit them so the frontend AI Decision Panel updates.
      // The actual "Incident" module already handles the DB creation, the Decision Engine is orchestrating.
    }
    
    decision.status = 'EXECUTED';
    decision.executed = true;
    decision.executionResult = 'Success';
    await decision.save();
    
    // Notify Frontend
    const io = getIo();
    io.emit('decision:executed', decision);
    
    await recordAudit(decision, 'SYSTEM', 'SUCCESS', 'Action executed safely');
  } catch (error: any) {
    decision.status = 'FAILED';
    decision.executionResult = error.message;
    await decision.save();
    
    const io = getIo();
    io.emit('decision:failed', decision);
    
    await recordAudit(decision, 'SYSTEM', 'FAILURE', error.message);
  }
};

export const approveAndExecuteDecision = async (decision: IDecisionLog, adminId: string) => {
  if (decision.status !== 'PENDING_APPROVAL') {
    throw new Error('Decision is not pending approval');
  }

  decision.approvedBy = adminId;
  decision.approvedAt = new Date();
  
  try {
    if (decision.action === 'MARK_CHARGER_UNAVAILABLE') {
      // In a real implementation, we'd update MongoDB/Redis status here.
      // E.g., await redisClient.set(`charger:${decision.chargerId}:status`, 'OFFLINE');
    } else if (decision.action === 'ESCALATE_INCIDENT') {
      // Escalate to external services or physical team.
    }

    decision.status = 'EXECUTED';
    decision.executed = true;
    decision.executionResult = 'Admin Approved and Executed';
    await decision.save();

    const io = getIo();
    io.emit('decision:executed', decision);

    await recordAudit(decision, adminId, 'SUCCESS', 'Admin approved sensitive action');
  } catch (error: any) {
    decision.status = 'FAILED';
    decision.executionResult = error.message;
    await decision.save();

    const io = getIo();
    io.emit('decision:failed', decision);
    
    await recordAudit(decision, adminId, 'FAILURE', error.message);
  }
};

const recordAudit = async (decision: IDecisionLog, actor: string, result: 'SUCCESS' | 'FAILURE' | 'PENDING_APPROVAL', reason?: string) => {
  const log = new AuditLog({
    actor,
    action: `EXECUTE_${decision.action}`,
    resource: 'Decision',
    resourceId: decision.decisionId,
    result,
    reason
  });
  await log.save();
};
