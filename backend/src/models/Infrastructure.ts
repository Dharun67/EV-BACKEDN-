import mongoose, { Schema, Document } from 'mongoose';

export interface IInfrastructure extends Document {
  zone: string;
  zoneType: string;
  currentChargers: number;
  requiredChargers: number;
  capacityGap: number;
  coverageScore: number;
  demandScore: number;
  utilization: number;
  growthPercentage: number;
  nearestChargerDistanceKm: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedChargers: number;
  createdAt: Date;
  updatedAt: Date;
}

const InfrastructureSchema: Schema = new Schema({
  zone: { type: String, required: true, unique: true, index: true },
  zoneType: { type: String, required: true },
  currentChargers: { type: Number, default: 0 },
  requiredChargers: { type: Number, default: 0 },
  capacityGap: { type: Number, default: 0 },
  coverageScore: { type: Number, default: 0 },
  demandScore: { type: Number, default: 0 },
  utilization: { type: Number, default: 0 },
  growthPercentage: { type: Number, default: 0 },
  nearestChargerDistanceKm: { type: Number, default: 0 },
  priority: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM' 
  },
  recommendedChargers: { type: Number, default: 0 }
}, {
  timestamps: true
});

export default mongoose.model<IInfrastructure>('Infrastructure', InfrastructureSchema);
