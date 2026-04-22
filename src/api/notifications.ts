import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import apiClient from './client';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: 'incoming_call' | 'spam_warning' | 'new_message' | 'verification' | 'system';
  [key: string]: any;
}

// Register for push notifications and get FCM token
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    // Create incoming call channel
    await Notifications.setNotificationChannelAsync('incoming_calls', {
      name: 'Incoming Calls',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 500, 500],
      lightColor: '#00FF00',
      bypassDnd: true,
      sound: 'default',
    });
  }

  // Check if we have permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // If not granted, request permission
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission not granted');
    return null;
  }

  // Get the push token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const pushTokenString = (
      await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      })
    ).data;
    
    token = pushTokenString;
    console.log('Push token:', token);
    
    // Register token with backend
    if (token) {
      await registerDeviceToken(token);
    }
    
  } catch (e) {
    console.error('Error getting push token:', e);
  }

  return token;
}

// Register device token with backend
async function registerDeviceToken(token: string): Promise<void> {
  try {
    await apiClient.post('/notifications/register-token', { token });
    console.log('Device token registered with backend');
  } catch (error) {
    console.error('Failed to register device token:', error);
  }
}

// Unregister device token (on logout)
export async function unregisterDeviceToken(token?: string): Promise<void> {
  try {
    await apiClient.delete('/notifications/unregister-token', {
      data: { token },
    });
    console.log('Device token unregistered');
  } catch (error) {
    console.error('Failed to unregister device token:', error);
  }
}

// Add notification listener
export function addNotificationListener(
  callback: (notification: Notifications.Notification) => void
): () => void {
  const subscription = Notifications.addNotificationReceivedListener(callback);
  return () => subscription.remove();
}

// Add notification response listener (when user taps on notification)
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(callback);
  return () => subscription.remove();
}

// Handle incoming call notification
export function handleIncomingCallNotification(
  notification: Notifications.Notification,
  router: any
): void {
  const data = notification.request.content.data as NotificationData;
  
  if (data.type === 'incoming_call') {
    const { callerName, callerNumber, callId } = data;
    
    // Navigate to incoming call screen
    router.push({
      pathname: '/incoming-call',
      params: {
        callId,
        callerNumber,
        name: callerName,
      },
    });
  }
}

// Schedule a local notification (for testing)
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: NotificationData,
  seconds: number = 1
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: seconds,
    } as any,
  });
  return id;
}

// Cancel all scheduled notifications
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Get badge count
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

// Set badge count
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}
