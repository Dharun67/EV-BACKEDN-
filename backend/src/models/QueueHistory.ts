import mongoose, { Document, Schema } from 'mongoose';

export interface IQueueHistory extends Document {
  stationId: string;
  timestamp: Date;
  queueLength: number;
  availableChargers: number;
  occupiedChargers: number;
  waitingTime: number;
  source: 'live_observation';
}

const queueHistorySchema = new Schema<IQueueHistory>({
  stationId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  queueLength: { type: Number, required: true },
  availableChargers: { type: Number, required: true },
  occupiedChargers: { type: Number, required: true },
  waitingTime: { type: Number, required: true },
  source: { type: String, default: 'live_observation' }
});

export default mongoose.model<IQueueHistory>('QueueHistory', queueHistorySchema);
