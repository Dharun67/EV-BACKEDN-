import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  bookingId: string;
  userId: string;
  stationId: string;
  chargerId: string;
  date: string; // YYYY-MM-DD format for easy querying
  startTime: string; // HH:mm format
  durationMinutes: number;
  status: 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'REBOOKED';
  estimatedEnergyKwh: number;
  estimatedCost: number;
  rebookedFromId?: string; // If this booking is a result of auto-rebooking
  createdAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  bookingId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  stationId: { type: String, required: true, index: true },
  chargerId: { type: String, required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  durationMinutes: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REBOOKED'],
    default: 'PENDING'
  },
  estimatedEnergyKwh: { type: Number, required: true },
  estimatedCost: { type: Number, required: true },
  rebookedFromId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IBooking>('Booking', bookingSchema);
