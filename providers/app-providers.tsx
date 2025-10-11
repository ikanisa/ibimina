"use client";

import { MotionProvider } from "@/providers/motion-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { ToastProvider } from "@/providers/toast-provider";
import { ConfirmProvider } from "@/providers/confirm-provider";
import { I18nProvider } from "@/providers/i18n-provider";
import { PwaProvider } from "@/providers/pwa-provider";
import { OfflineQueueProvider } from "@/providers/offline-queue-provider";
import { SupabaseAuthListener } from "@/providers/supabase-auth-listener";

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <I18nProvider>
      <ThemeProvider>
        <ToastProvider>
          <OfflineQueueProvider>
            <ConfirmProvider>
              <PwaProvider>
                <MotionProvider>
                  <SupabaseAuthListener />
                  {children}
                </MotionProvider>
              </PwaProvider>
            </ConfirmProvider>
          </OfflineQueueProvider>
        </ToastProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
