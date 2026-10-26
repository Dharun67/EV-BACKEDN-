import mongoose, { Schema, Document } from 'mongoose';

export interface IVehicle extends Document {
  vehicleId: string;
  userId?: string;
  fleetId?: string;
  brand?: string;
  vehicleModel: string;
  batteryCapacityKwh: number;
  batteryPercentage: number;
  rangeKm: number;
  status: string;
  energyConsumption: number;
  currentLocation?: {
    type: string;
    coordinates: number[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema: Schema = new Schema({
  vehicleId: { type: String, required: true, unique: true, index: true },
  userId: { type: String },
  fleetId: { type: String, index: true },
  brand: { type: String },
  vehicleModel: { type: String, required: true },
  batteryCapacityKwh: { type: Number, required: true },
  batteryPercentage: { type: Number, default: 100 },
  rangeKm: { type: Number, default: 0 },
  status: { type: String, default: 'ACTIVE' },
  energyConsumption: { type: Number, default: 0 },
  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] }
  }
}, {
  timestamps: true
});

export default mongoose.model<IVehicle>('Vehicle', VehicleSchema);
