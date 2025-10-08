"use client";

import { useEffect, useState } from "react";
import { AddToHomeBanner } from "@/components/system/add-to-home-banner";
import { useTranslation } from "@/providers/i18n-provider";
import { useToast } from "@/providers/toast-provider";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PwaProviderProps {
  children: React.ReactNode;
}

export function PwaProvider({ children }: PwaProviderProps) {
  const { t } = useTranslation();
  const { success } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // no-op; registration will be retried on navigation
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setBannerVisible(true);
    };

    const handleAppInstalled = () => {
      setBannerVisible(false);
      setDeferredPrompt(null);
      success(t("toast.genericSuccess"));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [success, t]);

  const onInstall = async () => {
    if (!deferredPrompt) {
      setBannerVisible(false);
      return;
    }
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        success(t("toast.genericSuccess"));
      }
    } finally {
      setDeferredPrompt(null);
      setBannerVisible(false);
    }
  };

  const onDismiss = () => {
    setBannerVisible(false);
    setTimeout(() => setDeferredPrompt(null), 1000);
  };

  return (
    <>
      {children}
      <AddToHomeBanner
        open={bannerVisible}
        title={t("addToHome.title")}
        description={t("addToHome.description")}
        installLabel={t("addToHome.install")}
        dismissLabel={t("addToHome.dismiss")}
        onInstall={onInstall}
        onDismiss={onDismiss}
      />
    </>
  );
}
