"use client";

import { useCallback, useMemo } from "react";

import { useOfflineQueue } from "@/src/hooks/useOfflineQueue";
import { useOnlineStatus } from "@/src/hooks/useOnlineStatus";
import { useLocaleMessages } from "@/src/hooks/useLocaleMessages";

import styles from "./OfflineBanner.module.css";

export function OfflineBanner() {
  const online = useOnlineStatus();
  const { pendingCount, refresh, clear } = useOfflineQueue();
  const { common } = useLocaleMessages();

  const handleSync = useCallback(() => {
    window.dispatchEvent(new Event("offline-queue:sync"));
    refresh();
  }, [refresh]);

  const queuedMessage = useMemo(() => {
    const { queuedOne, queuedOther } = common.offlineBanner;
    const template = pendingCount === 1 ? queuedOne : queuedOther;
    return template.replace("{{count}}", pendingCount.toString());
  }, [common.offlineBanner, pendingCount]);

  if (online && pendingCount === 0) {
    return null;
  }

  return (
    <div className={styles.banner} role="status" aria-live="polite">
      {!online ? <span>{common.offlineBanner.offline}</span> : <span>{queuedMessage}</span>}
      <div className={styles.actions}>
        {online && pendingCount > 0 ? (
          <button type="button" className={styles.button} onClick={handleSync}>
            {common.offlineBanner.sync}
          </button>
        ) : null}
        {pendingCount > 0 ? (
          <button type="button" className={styles.button} onClick={clear}>
            {common.offlineBanner.clear}
          </button>
        ) : null}
      </div>
    </div>
  );
}
