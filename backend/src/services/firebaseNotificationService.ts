import { getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import UserNotificationDevice from '../models/UserNotificationDevice';
import User from '../models/User';
import mongoose from 'mongoose';

export interface NotificationPayload {
  title: string;
  body: string;
  type: string;
  data?: Record<string, string>;
}

export const sendToUser = async (userId: string, payload: NotificationPayload): Promise<void> => {
  try {
    if (!getApps().length) return;

    // Check user preferences
    const user = await User.findById(userId).select('notificationPreferences');
    if (user && user.notificationPreferences) {
      const prefs = user.notificationPreferences as any;
      if (
        (payload.type === 'BOOKING_CONFIRMED' || payload.type === 'BOOKING_CANCELLED' || payload.type === 'BOOKING_REBOOKED') && prefs.bookingNotifications === false ||
        (payload.type === 'QUEUE_JOINED' || payload.type === 'QUEUE_POSITION_UPDATED' || payload.type === 'WAITING_TIME_UPDATED') && prefs.queueNotifications === false ||
        (payload.type === 'CHARGING_SESSION_STARTED' || payload.type === 'CHARGING_SESSION_COMPLETED') && prefs.chargingNotifications === false ||
        (payload.type === 'STATION_UNAVAILABLE' || payload.type === 'INCIDENT_ALERT') && prefs.incidentNotifications === false ||
        (payload.type === 'MAINTENANCE_ALERT') && prefs.maintenanceNotifications === false
      ) {
        console.log(`[FCM] Notification of type ${payload.type} skipped due to user preferences for ${userId}`);
        return;
      }
    }

    // Retrieve active devices
    const devices = await UserNotificationDevice.find({ userId, active: true });
    if (!devices.length) return;

    const tokens = devices.map(d => d.token);
    
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        type: payload.type,
        ...payload.data
      },
      tokens: tokens
    };

    const response = await getMessaging().sendEachForMulticast(message);
    
    // Handle invalid tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success) {
          const error = resp.error;
          if (error && (
            error.code === 'messaging/invalid-registration-token' || 
            error.code === 'messaging/registration-token-not-registered'
          )) {
            failedTokens.push(tokens[idx]);
          }
        }
      });

      if (failedTokens.length > 0) {
        console.log(`[FCM] Deactivating ${failedTokens.length} invalid tokens for user ${userId}`);
        await UserNotificationDevice.updateMany(
          { token: { $in: failedTokens } },
          { $set: { active: false } }
        );
      }
    }

  } catch (error) {
    console.error(`[FCM] Failed to send notification to user ${userId}:`, error);
  }
};
