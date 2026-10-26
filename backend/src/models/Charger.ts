import mongoose, { Schema, Document } from 'mongoose';

export interface ICharger extends Document {
  chargerId: string;
  stationId: string;
  type: 'AC' | 'DC_FAST' | 'ULTRA_FAST';
  powerKw: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'FAULT' | 'OFFLINE';
  connectorType: string;
  health: number;
  uptime: number;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChargerSchema: Schema = new Schema({
  chargerId: { type: String, required: true, unique: true, index: true },
  stationId: { type: String, required: true, index: true },
  type: { 
    type: String, 
    enum: ['AC', 'DC_FAST', 'ULTRA_FAST'],
    required: true 
  },
  powerKw: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'FAULT', 'OFFLINE'],
    default: 'AVAILABLE' 
  },
  connectorType: { type: String, required: true },
  health: { type: Number, default: 100 },
  uptime: { type: Number, default: 100 },
  lastMaintenance: { type: Date },
  nextMaintenance: { type: Date }
}, {
  timestamps: true
});

export default mongoose.model<ICharger>('Charger', ChargerSchema);
