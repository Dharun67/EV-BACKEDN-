import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IQueueEntry extends Document {
  queueEntryId: string;
  userId: mongoose.Types.ObjectId;
  stationId: string;
  connectorId?: string;
  vehicleId: string;
  position: number;
  status: 'WAITING' | 'CALLED' | 'SERVING' | 'LEFT' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED';
  joinedAt: Date;
  estimatedWaitMinutes: number;
  priority: number;
  lastUpdatedAt: Date;
}

const queueEntrySchema = new Schema<IQueueEntry>({
  queueEntryId: { type: String, required: true, unique: true, default: uuidv4 },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  stationId: { type: String, required: true, index: true },
  connectorId: { type: String },
  vehicleId: { type: String, required: true },
  position: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['WAITING', 'CALLED', 'SERVING', 'LEFT', 'CANCELLED', 'COMPLETED', 'EXPIRED'],
    default: 'WAITING'
  },
  joinedAt: { type: Date, default: Date.now },
  estimatedWaitMinutes: { type: Number, default: 0 },
  priority: { type: Number, default: 0 },
  lastUpdatedAt: { type: Date, default: Date.now }
});

// Enforce single active queue entry per user/station combo
queueEntrySchema.index({ userId: 1, stationId: 1, status: 1 });

export default mongoose.model<IQueueEntry>('QueueEntry', queueEntrySchema);
