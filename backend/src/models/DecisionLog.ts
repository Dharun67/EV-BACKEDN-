import mongoose, { Schema, Document } from 'mongoose';

export interface IDecisionLog extends Document {
  decisionId: string;
  timestamp: Date;
  stationId?: string;
  chargerId?: string;
  bookingId?: string;
  action: string; // e.g., NO_ACTION, RECOMMEND_REBOOKING, CREATE_QUEUE_ALERT
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
  evidence: string[];
  source: string; // e.g., 'QUEUE_ENGINE', 'DEMAND_ENGINE', 'INCIDENT_ENGINE'
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'FAILED' | 'NO_ACTION';
  executed: boolean;
  executionResult?: string;
  approvedBy?: string;
  approvedAt?: Date;
}

const DecisionLogSchema: Schema = new Schema({
  decisionId: { type: String, required: true, unique: true },
  timestamp: { type: Date, default: Date.now },
  stationId: { type: String },
  chargerId: { type: String },
  bookingId: { type: String },
  action: { type: String, required: true },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], required: true },
  reason: { type: String, required: true },
  evidence: [{ type: String }],
  source: { type: String, required: true },
  status: { type: String, required: true },
  executed: { type: Boolean, default: false },
  executionResult: { type: String },
  approvedBy: { type: String },
  approvedAt: { type: Date }
});

DecisionLogSchema.index({ timestamp: -1 });
DecisionLogSchema.index({ status: 1 });
DecisionLogSchema.index({ stationId: 1 });

export default mongoose.models.DecisionLog || mongoose.model<IDecisionLog>('DecisionLog', DecisionLogSchema);
