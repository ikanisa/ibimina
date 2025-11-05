import { create } from "zustand";
import { User, Account, Group, Notification } from "../types";

interface AppState {
  // Auth state
  user: User | null;
  session: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Account state
  accounts: Account[];
  selectedAccount: Account | null;

  // Group state
  groups: Group[];
  selectedGroup: Group | null;

  // Notifications
  notifications: Notification[];
  unreadCount: number;

  // UI state
  isDarkMode: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: any | null) => void;
  setLoading: (loading: boolean) => void;
  setAccounts: (accounts: Account[]) => void;
  setSelectedAccount: (account: Account | null) => void;
  setGroups: (groups: Group[]) => void;
  setSelectedGroup: (group: Group | null) => void;
  setNotifications: (notifications: Notification[]) => void;
  markNotificationRead: (id: string) => void;
  toggleDarkMode: () => void;
  reset: () => void;
}

const initialState = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  accounts: [],
  selectedAccount: null,
  groups: [],
  selectedGroup: null,
  notifications: [],
  unreadCount: 0,
  isDarkMode: false,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  setSession: (session) => set({ session }),

  setLoading: (isLoading) => set({ isLoading }),

  setAccounts: (accounts) => set({ accounts }),

  setSelectedAccount: (selectedAccount) => set({ selectedAccount }),

  setGroups: (groups) => set({ groups }),

  setSelectedGroup: (selectedGroup) => set({ selectedGroup }),

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    }),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  toggleDarkMode: () =>
    set((state) => ({
      isDarkMode: !state.isDarkMode,
    })),

  reset: () => set(initialState),
}));
