import mongoose, { Schema, Document } from 'mongoose';

export interface IFleet extends Document {
  fleetId: string;
  name: string;
  organization: string;
  vehicleCount: number;
  activeVehicles: number;
  chargingVehicles: number;
  utilization: number;
  energyConsumption: number;
  createdAt: Date;
  updatedAt: Date;
}

const FleetSchema: Schema = new Schema({
  fleetId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  organization: { type: String, required: true },
  vehicleCount: { type: Number, default: 0 },
  activeVehicles: { type: Number, default: 0 },
  chargingVehicles: { type: Number, default: 0 },
  utilization: { type: Number, default: 0 },
  energyConsumption: { type: Number, default: 0 }
}, {
  timestamps: true
});

export default mongoose.model<IFleet>('Fleet', FleetSchema);
