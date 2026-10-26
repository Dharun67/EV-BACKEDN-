import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  firebaseUid?: string;
  password?: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  emailVerified: boolean;
  profileImage?: string;
  organization?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED';
  lastLoginAt?: Date;
  notificationPreferences?: {
    bookingNotifications: boolean;
    queueNotifications: boolean;
    chargingNotifications: boolean;
    incidentNotifications: boolean;
    maintenanceNotifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  firebaseUid: { type: String, unique: true, sparse: true },
  password: { type: String },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  role: { 
    type: String, 
    enum: ['USER', 'ADMIN'],
    required: true,
    default: 'USER'
  },
  emailVerified: { type: Boolean, default: false },
  profileImage: { type: String },
  organization: { type: String },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'SUSPENDED', 'DISABLED'],
    default: 'ACTIVE' 
  },
  lastLoginAt: { type: Date },
  notificationPreferences: {
    bookingNotifications: { type: Boolean, default: true },
    queueNotifications: { type: Boolean, default: true },
    chargingNotifications: { type: Boolean, default: true },
    incidentNotifications: { type: Boolean, default: true },
    maintenanceNotifications: { type: Boolean, default: true },
  }
}, {
  timestamps: true
});

export default mongoose.model<IUser>('User', UserSchema);
