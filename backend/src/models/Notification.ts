import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  notificationId: string;
  userId?: string;
  title: string;
  message: string;
  type: 'DEMAND_ALERT' | 'MAINTENANCE_ALERT' | 'INFRASTRUCTURE_ALERT' | 'REVENUE_ALERT' | 'SYSTEM';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  read: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
  notificationId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['DEMAND_ALERT', 'MAINTENANCE_ALERT', 'INFRASTRUCTURE_ALERT', 'REVENUE_ALERT', 'SYSTEM'],
    required: true 
  },
  priority: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM' 
  },
  read: { type: Boolean, default: false }
}, {
  timestamps: true
});

export default mongoose.model<INotification>('Notification', NotificationSchema);
