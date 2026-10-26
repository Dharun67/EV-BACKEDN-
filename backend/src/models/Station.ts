import mongoose, { Schema, Document } from 'mongoose';

export interface IStation extends Document {
  stationId: string;
  name: string;
  location: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
  };
  address: string;
  city?: string;
  state?: string;
  postcode?: string;
  zone: string;
  zoneType: string;
  status: string;
  totalChargers: number;
  availableChargers: number;
  utilization: number;
  powerCapacityKw: number;
  rating: number;
  uptime: number;
  hostId?: string;
  hostName?: string;
  type?: string;
  pricePerKwh?: number;
  powerKw?: number;
  createdAt: Date;
  updatedAt: Date;
}

const StationSchema: Schema = new Schema({
  stationId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [lng, lat]
  },
  address: { type: String, required: true },
  city: { type: String },
  state: { type: String },
  postcode: { type: String },
  zone: { type: String, index: true },
  zoneType: { type: String },
  status: { type: String, default: 'Operational' },
  totalChargers: { type: Number, default: 0 },
  availableChargers: { type: Number, default: 0 },
  utilization: { type: Number, default: 0 },
  powerCapacityKw: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  uptime: { type: Number, default: 0 },
  hostId: { type: String },
  hostName: { type: String },
  type: { type: String, default: 'Commercial' },
  pricePerKwh: { type: Number },
  powerKw: { type: Number }
}, {
  timestamps: true
});

StationSchema.index({ location: '2dsphere' });

export default mongoose.model<IStation>('Station', StationSchema);
