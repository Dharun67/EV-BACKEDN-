import mongoose, { Schema, Document } from 'mongoose';

export interface IChargingSession extends Document {
  sessionId: string;
  stationId: string;
  chargerId?: string;
  vehicleId?: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  energyKwh: number;
  durationMinutes: number;
  cost?: number;
  status: string;
  paymentStatus?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChargingSessionSchema: Schema = new Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  stationId: { type: String, required: true, index: true },
  chargerId: { type: String },
  vehicleId: { type: String, index: true },
  userId: { type: String, index: true },
  startTime: { type: Date, required: true, index: true },
  endTime: { type: Date },
  energyKwh: { type: Number, required: true },
  durationMinutes: { type: Number, required: true },
  cost: { type: Number },
  status: { type: String, default: 'COMPLETED' },
  paymentStatus: { type: String, default: 'PAID' }
}, {
  timestamps: true
});

export default mongoose.model<IChargingSession>('ChargingSession', ChargingSessionSchema);
