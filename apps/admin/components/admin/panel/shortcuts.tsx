"use client";

import { useEffect } from "react";

const APPROVAL_KEYS = new Map([
  ["a", "approve"],
  ["r", "reject"],
  ["m", "merge"],
]);

export function AdminPanelShortcuts({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();
      const action = APPROVAL_KEYS.get(key);
      if (!action) return;
      event.preventDefault();
      window.dispatchEvent(
        new CustomEvent("admin-panel:shortcut", {
          detail: { action },
        }),
      );
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return <>{children}</>;
}

export type AdminPanelShortcutDetail = {
  action: "approve" | "reject" | "merge";
};
