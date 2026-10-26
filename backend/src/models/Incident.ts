import mongoose, { Schema, Document } from 'mongoose';

export interface IIncident extends Document {
  incidentId: string;
  stationId?: string;
  chargerId?: string;
  bookingId?: string;
  type: 'CHARGER_FAULT' | 'CHARGER_OFFLINE' | 'STATION_UNAVAILABLE' | 'HIGH_QUEUE' | 'EXTREME_WAITING_TIME' | 'BOOKING_FAILURE' | 'MAINTENANCE_REQUIRED' | 'PREDICTED_CAPACITY_SHORTAGE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'INVESTIGATING' | 'ACTION_REQUIRED' | 'RESOLVED' | 'CLOSED';
  description: string;
  detectedAt: Date;
  resolvedAt?: Date;
  source: 'SYSTEM' | 'USER' | 'ADMIN' | 'ML_SERVICE';
  relatedPrediction?: any;
  automatedAction?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IncidentSchema: Schema = new Schema({
  incidentId: { type: String, required: true, unique: true },
  stationId: { type: String, required: false },
  chargerId: { type: String, required: false },
  bookingId: { type: String, required: false },
  type: { 
    type: String, 
    required: true,
    enum: ['CHARGER_FAULT', 'CHARGER_OFFLINE', 'STATION_UNAVAILABLE', 'HIGH_QUEUE', 'EXTREME_WAITING_TIME', 'BOOKING_FAILURE', 'MAINTENANCE_REQUIRED', 'PREDICTED_CAPACITY_SHORTAGE']
  },
  severity: { 
    type: String, 
    required: true,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
  },
  status: { 
    type: String, 
    required: true,
    enum: ['OPEN', 'INVESTIGATING', 'ACTION_REQUIRED', 'RESOLVED', 'CLOSED'],
    default: 'OPEN'
  },
  description: { type: String, required: true },
  detectedAt: { type: Date, required: true, default: Date.now },
  resolvedAt: { type: Date, required: false },
  source: { type: String, required: true },
  relatedPrediction: { type: Schema.Types.Mixed, required: false },
  automatedAction: { type: String, required: false }
}, {
  timestamps: true
});

// Index for deduplication lookups
IncidentSchema.index({ type: 1, chargerId: 1, stationId: 1, status: 1 });

export default mongoose.model<IIncident>('Incident', IncidentSchema);
