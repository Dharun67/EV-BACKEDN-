import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  actor: 'SYSTEM' | 'USER' | 'ADMIN';
  action: string;
  resource: string;
  resourceId: string;
  timestamp: Date;
  result: 'SUCCESS' | 'FAILURE' | 'PENDING_APPROVAL';
  reason?: string;
}

const AuditLogSchema: Schema = new Schema({
  actor: { type: String, required: true },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  result: { type: String, required: true },
  reason: { type: String, required: false }
});

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
