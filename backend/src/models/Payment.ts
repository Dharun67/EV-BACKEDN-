import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  paymentId: string;
  userId: string;
  sessionId: string;
  amount: number;
  currency: string;
  method: 'UPI' | 'CARD' | 'WALLET' | 'CORPORATE';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  transactionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema({
  paymentId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  method: { 
    type: String, 
    enum: ['UPI', 'CARD', 'WALLET', 'CORPORATE'],
    required: true 
  },
  status: { 
    type: String, 
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
    default: 'PENDING' 
  },
  transactionDate: { type: Date, required: true }
}, {
  timestamps: true
});

export default mongoose.model<IPayment>('Payment', PaymentSchema);
