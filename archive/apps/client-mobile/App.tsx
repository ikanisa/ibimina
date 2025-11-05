/**
 * Ibimina Client Mobile App
 * Minimalist, Revolut-inspired SACCO app for Rwandan clients
 */

import React, { useEffect, useRef } from "react";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainerRef } from "@react-navigation/native";
import * as Linking from "expo-linking";
import "react-native-url-polyfill/auto";

import { AppNavigator } from "./src/navigation/AppNavigator";
import { useAuthStore } from "./src/store";
import { authService } from "./src/services/supabase";
import { deepLinkService } from "./src/services/deeplink";
import { notificationService } from "./src/services/notifications";
import { colors } from "./src/theme";

export default function App() {
  const { setSession, setLoading, session, user } = useAuthStore();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    // Set navigation ref for deep linking
    if (navigationRef.current) {
      deepLinkService.setNavigationRef(navigationRef.current);
    }

    // Initialize auth state
    authService
      .getSession()
      .then((session) => setSession(session))
      .catch(() => setSession(null))
      .finally(() => setLoading(false));

    // Listen to auth changes
    const {
      data: { subscription },
    } = authService.onAuthStateChange((session) => {
      setSession(session);
    });

    return () => subscription?.unsubscribe();
  }, []);

  // Set up push notifications after auth
  useEffect(() => {
    if (user?.id) {
      notificationService.registerForPushNotifications(user.id);
    }
  }, [user?.id]);

  // Handle deep links
  useEffect(() => {
    // Handle initial URL (app opened via deep link)
    deepLinkService.getInitialUrl().then((url) => {
      if (url) {
        setTimeout(() => deepLinkService.handleUrl(url), 1000);
      }
    });

    // Subscribe to incoming deep links
    const subscription = deepLinkService.subscribe((url) => {
      deepLinkService.handleUrl(url);
    });

    return () => subscription.remove();
  }, []);

  // Handle notification responses
  useEffect(() => {
    const subscription = notificationService.addNotificationResponseReceivedListener(() => {
      // Navigation is handled by the service
      notificationService.clearBadge();
    });

    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
        <AppNavigator ref={navigationRef} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
