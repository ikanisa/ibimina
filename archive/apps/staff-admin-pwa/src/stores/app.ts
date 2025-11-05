import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark' | 'system';

interface AppState {
  theme: ThemeMode;
  language: string;
  notificationsEnabled: boolean;
  sidebarOpen: boolean;
  isOffline: boolean;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setIsOffline: (offline: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'en',
      notificationsEnabled: false,
      sidebarOpen: true,
      isOffline: false,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setIsOffline: (offline) => set({ isOffline: offline }),
    }),
    {
      name: 'app-settings',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        notificationsEnabled: state.notificationsEnabled,
      }),
    }
  )
);
