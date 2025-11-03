/**
 * Ibimina Client Mobile App
 * Minimalist, Revolut-inspired SACCO app for Rwandan clients
 */

import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import 'react-native-url-polyfill/auto';

import {AppNavigator} from './src/navigation/AppNavigator';
import {useAuthStore} from './src/store';
import {authService} from './src/services/supabase';
import {FirebaseService} from './src/services/firebase';
import {colors} from './src/theme';

export default function App() {
  const {setSession, setLoading} = useAuthStore();

  useEffect(() => {
    // Initialize Firebase
    FirebaseService.initialize().catch(console.error);

    // Initialize auth state
    authService.getSession()
      .then(session => setSession(session))
      .catch(() => setSession(null))
      .finally(() => setLoading(false));

    // Listen to auth changes
    const {data: {subscription}} = authService.onAuthStateChange(session => {
      setSession(session);
    });

    return () => subscription?.unsubscribe();
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
