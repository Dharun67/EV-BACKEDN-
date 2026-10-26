import { subscribeToEvent, GridWiseEvent } from '../services/eventService';
import { sendToUser, NotificationPayload } from '../services/firebaseNotificationService';

const QUEUE_NAME = 'notification.processor';
const ROUTING_KEY = 'notification.requested';

export const initFCMWorker = async () => {
  console.log('[FCM Worker] Initializing...');
  await subscribeToEvent(QUEUE_NAME, ROUTING_KEY, async (event: GridWiseEvent) => {
    const data = event.data;
    
    if (!data || !data.userId) {
      console.warn(`[FCM Worker] Event ${event.eventId} missing userId`);
      return;
    }

    const payload: NotificationPayload = {
      title: data.title || 'GridWise Update',
      body: data.body || '',
      type: data.type || 'SYSTEM_ALERT',
      data: data.metadata || {}
    };

    console.log(`[FCM Worker] Processing notification for user ${data.userId}: ${payload.type}`);
    await sendToUser(data.userId, payload);
  });
};
