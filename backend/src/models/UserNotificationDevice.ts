import mongoose, { Schema, Document } from 'mongoose';

export interface IUserNotificationDevice extends Document {
  userId: mongoose.Types.ObjectId | string;
  token: string;
  platform: 'web' | 'ios' | 'android' | 'other';
  active: boolean;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserNotificationDeviceSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  token: { type: String, required: true, unique: true },
  platform: { 
    type: String, 
    enum: ['web', 'ios', 'android', 'other'],
    default: 'web' 
  },
  active: { type: Boolean, default: true },
  lastUsedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Ensure a user can only have one token of the same string
UserNotificationDeviceSchema.index({ userId: 1, token: 1 }, { unique: true });

export default mongoose.model<IUserNotificationDevice>('UserNotificationDevice', UserNotificationDeviceSchema);
