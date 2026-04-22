import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  registerForPushNotificationsAsync,
  addNotificationListener,
  addNotificationResponseListener,
  handleIncomingCallNotification,
} from "@/src/api/notifications";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const router = useRouter();
  const notificationListener = useRef<(() => void) | null>(null);
  const responseListener = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Register for push notifications
    registerForPushNotificationsAsync();

    // Listen for incoming notifications while app is in foreground
    notificationListener.current = addNotificationListener((notification) => {
      console.log('Notification received:', notification);
      
      const data = notification.request.content.data;
      if (data?.type === 'incoming_call') {
        handleIncomingCallNotification(notification, router);
      }
    });

    // Listen for notification responses (when user taps on notification)
    responseListener.current = addNotificationResponseListener((response) => {
      console.log('Notification response:', response);
      
      const data = response.notification.request.content.data;
      if (data?.type === 'incoming_call') {
        router.push({
          pathname: '/incoming-call',
          params: {
            callId: data.callId,
            callerNumber: data.callerNumber,
            name: data.callerName,
          },
        });
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current();
      }
      if (responseListener.current) {
        responseListener.current();
      }
    };
  }, [router]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="permissions" />
      <Stack.Screen name="login" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="call-details" />
      <Stack.Screen name="incoming-call" />
      <Stack.Screen name="dialpad" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="spam-management" />
      <Stack.Screen name="who-viewed" />
      <Stack.Screen name="favorites" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="help" />
      <Stack.Screen name="about" />
      <Stack.Screen name="settings/notifications" />
      <Stack.Screen name="settings/privacy" />
      <Stack.Screen name="settings/security" />
      <Stack.Screen name="settings/language" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <RootLayoutNav />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
