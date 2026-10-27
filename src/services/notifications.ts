import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

type Notifications = typeof import('expo-notifications');
let loading: Promise<Notifications | null> | undefined;

// The notifications barrel eagerly loads Android topic subscriptions, even
// though FocusBubble only uses local alerts. Older clients may lack that module.
// Keep this optional integration out of route-module initialization entirely.
export function getNotifications(): Promise<Notifications | null> {
  if (Platform.OS === 'web') return Promise.resolve(null);
  if (Platform.OS === 'android' && !requireOptionalNativeModule('ExpoTopicSubscriptionModule')) {
    return Promise.resolve(null);
  }
  loading ??= import('expo-notifications').catch(error => {
    console.warn('Optional notifications could not load:', error);
    return null;
  });
  return loading;
}

export async function requireNotifications(): Promise<Notifications> {
  const notifications = await getNotifications();
  if (!notifications) {
    throw new Error('Notifications are unavailable in this client. Install an updated FocusBubble development build, then try again. Your goals and focus timer still work.');
  }
  return notifications;
}
