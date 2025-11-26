'use client';

import { useEffect, useState } from 'react';
import {
  UpdateInfo,
  DownloadProgress,
  onUpdateAvailable,
  onDownloadProgress,
  downloadUpdate,
  installUpdate,
  isTauri,
} from '@/lib/tauri';

export function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [installerPath, setInstallerPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only run in Tauri environment
    if (!isTauri()) return;

    // Listen for update notifications
    const unsubscribe = onUpdateAvailable((info) => {
      setUpdateInfo(info);
    });

    // Listen for download progress
    const unsubscribeProgress = onDownloadProgress((prog) => {
      setProgress(prog);
    });

    return () => {
      unsubscribe.then((fn) => fn());
      unsubscribeProgress.then((fn) => fn());
    };
  }, []);

  const handleDownload = async () => {
    if (!updateInfo) return;

    try {
      setDownloading(true);
      setError(null);
      const path = await downloadUpdate(updateInfo.download_url);
      setInstallerPath(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleInstall = async () => {
    if (!installerPath) return;

    try {
      setError(null);
      await installUpdate(installerPath);
      // App will restart automatically
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Installation failed');
    }
  };

  const handleDismiss = () => {
    setUpdateInfo(null);
    setProgress(null);
    setInstallerPath(null);
    setError(null);
  };

  if (!updateInfo || !isTauri()) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Update Available
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Version {updateInfo.latest_version} is now available.
          </p>
          {updateInfo.release_notes && (
            <div className="mt-2 max-h-32 overflow-y-auto rounded border border-gray-200 bg-gray-50 p-2 text-xs dark:border-gray-600 dark:bg-gray-900">
              <pre className="whitespace-pre-wrap font-mono text-gray-700 dark:text-gray-300">
                {updateInfo.release_notes}
              </pre>
            </div>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Dismiss"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded bg-red-50 p-2 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {progress && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>Downloading...</span>
            <span>{progress.percentage.toFixed(0)}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {!installerPath ? (
          <>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloading ? 'Downloading...' : 'Download Update'}
            </button>
            <button
              onClick={handleDismiss}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Later
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleInstall}
              className="flex-1 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Install & Restart
            </button>
            <button
              onClick={handleDismiss}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Later
            </button>
          </>
        )}
      </div>
    </div>
  );
}
