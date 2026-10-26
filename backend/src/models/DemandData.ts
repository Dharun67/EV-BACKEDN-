import mongoose, { Schema, Document } from 'mongoose';

export interface IDemandData extends Document {
  location: string;
  zone: string;
  timestamp: Date;
  demandScore: number;
  sessions: number;
  energyDemandKwh: number;
  peakDemand: number;
  utilization: number;
  forecastDemand: number;
  createdAt: Date;
  updatedAt: Date;
}

const DemandDataSchema: Schema = new Schema({
  location: { type: String, required: true, index: true },
  zone: { type: String, required: true },
  timestamp: { type: Date, required: true, index: true },
  demandScore: { type: Number, required: true },
  sessions: { type: Number, default: 0 },
  energyDemandKwh: { type: Number, default: 0 },
  peakDemand: { type: Number, default: 0 },
  utilization: { type: Number, default: 0 },
  forecastDemand: { type: Number, default: 0 }
}, {
  timestamps: true
});

DemandDataSchema.index({ location: 1, timestamp: -1 });

export default mongoose.model<IDemandData>('DemandData', DemandDataSchema);
