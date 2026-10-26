import mongoose, { Schema, Document } from 'mongoose';

export interface IMaintenance extends Document {
  maintenanceId: string;
  chargerId: string;
  stationId: string;
  issue: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'SCHEDULED';
  healthScore: number;
  faultType?: string;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  repairCost?: number;
  downtimeHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceSchema: Schema = new Schema({
  maintenanceId: { type: String, required: true, unique: true, index: true },
  chargerId: { type: String, required: true, index: true },
  stationId: { type: String, required: true, index: true },
  issue: { type: String, required: true },
  priority: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM' 
  },
  status: { 
    type: String, 
    enum: ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'SCHEDULED'],
    default: 'PENDING' 
  },
  healthScore: { type: Number, default: 100 },
  faultType: { type: String },
  lastMaintenance: { type: Date },
  nextMaintenance: { type: Date },
  repairCost: { type: Number, default: 0 },
  downtimeHours: { type: Number, default: 0 }
}, {
  timestamps: true
});

export default mongoose.model<IMaintenance>('Maintenance', MaintenanceSchema);
