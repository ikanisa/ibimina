import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/ThemeProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingFallback } from './components/LoadingFallback';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/AppShell';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useAppStore } from './stores/app';
import { initDB } from './lib/storage';
import { setupBackgroundSync } from './lib/sync';
import { registerSW } from './workers/register-sw';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const UsersPage = lazy(() =>
  import('./pages/UsersPage').then((m) => ({ default: m.UsersPage }))
);
const OrdersPage = lazy(() =>
  import('./pages/OrdersPage').then((m) => ({ default: m.OrdersPage }))
);
const TicketsPage = lazy(() =>
  import('./pages/TicketsPage').then((m) => ({ default: m.TicketsPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const setIsOffline = useAppStore((state) => state.setIsOffline);

  useEffect(() => {
    // Initialize IndexedDB
    initDB();
    
    // Setup background sync
    setupBackgroundSync();
    
    // Register service worker
    registerSW();

    // Initialize Capacitor if running on native platform
    if (Capacitor.isNativePlatform()) {
      initCapacitor();
    }

    // Network status listeners
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOffline]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <Routes>
                          <Route path="/" element={<DashboardPage />} />
                          <Route path="/users" element={<UsersPage />} />
                          <Route path="/orders" element={<OrdersPage />} />
                          <Route path="/tickets" element={<TicketsPage />} />
                          <Route path="/settings" element={<SettingsPage />} />
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
          </BrowserRouter>
          <OfflineIndicator />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Initialize Capacitor native features
async function initCapacitor() {
  try {
    // Hide splash screen after app is ready
    await SplashScreen.hide();

    // Configure status bar
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#1976d2' });
    }

    // Handle app state changes
    CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active?', isActive);
    });

    // Handle deep links
    CapacitorApp.addListener('appUrlOpen', (event) => {
      console.log('App opened with URL:', event.url);
      // Handle deep link navigation here
    });

    // Handle back button (Android)
    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        CapacitorApp.exitApp();
      } else {
        window.history.back();
      }
    });

    console.log('Capacitor initialized successfully');
  } catch (error) {
    console.error('Error initializing Capacitor:', error);
  }
}

export default App;
