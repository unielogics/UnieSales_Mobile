import { Capacitor } from '@capacitor/core';
import { api } from './api';

// FCM push registration. No-ops on web (browser dev). On Android it requests
// permission, registers with FCM, posts the device token to the backend, and
// wires deep-link handling when a notification is tapped.
//
// The backend `/users/me/push-subscriptions` endpoint ships in Phase 2; until
// then the POST fails silently and is retried on the next launch.

export type DeepLink =
  | { type: 'lead'; id: string }
  | { type: 'thread'; id: string }
  | { type: 'alerts' };

let registered = false;

export async function registerPush(onDeepLink: (link: DeepLink) => void): Promise<void> {
  if (Capacitor.getPlatform() !== 'android' || registered) return;
  registered = true;

  // Dynamic import so the web bundle never pulls the native-only plugin.
  const { PushNotifications } = await import('@capacitor/push-notifications');

  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== 'granted') return;

  // High-importance channel so alerts pop as a heads-up banner with sound on the
  // lock screen — the backend routes every push to this channel id. Idempotent.
  await PushNotifications.createChannel({
    id: 'uniesales_alerts',
    name: 'UnieSales Alerts',
    description: 'Hot leads, replies, meetings, deals at risk and tasks due',
    importance: 5, // HIGH — heads-up
    visibility: 1, // PUBLIC — show on lock screen
    vibration: true,
    lights: true,
  });

  await PushNotifications.register();

  PushNotifications.addListener('registration', async (token) => {
    try {
      await api.post('/users/me/push-subscriptions', {
        deviceToken: token.value,
        platform: 'android-fcm',
        deviceLabel: 'Z Fold',
      });
    } catch {
      /* backend endpoint not live yet (pre-Phase 2) — retried next launch */
    }
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    const d = (action.notification.data ?? {}) as Record<string, string>;
    if (d.leadId) onDeepLink({ type: 'lead', id: d.leadId });
    else if (d.threadId) onDeepLink({ type: 'thread', id: d.threadId });
    else onDeepLink({ type: 'alerts' });
  });
}
