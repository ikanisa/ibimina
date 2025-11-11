# Offline onboarding queue

The staff console now supports capturing member onboarding submissions while
devices are offline. This page documents how the queue works and how to monitor
it during support or troubleshooting.

## Storage and helper

- Submissions are stored in IndexedDB under the `ibimina-onboarding` database
  and the `submissions` object store.
- The helper lives at `apps/admin/lib/offline/onboarding-queue.ts` and exposes:
  - `enqueueOnboardingSubmission(payload)` to persist a form payload.
  - `getOnboardingQueueStats()` to report pending, syncing, and failed counts.
  - `syncQueuedOnboarding()` which POSTs queued payloads to
    `/api/member/onboard/sync` and removes successful entries.
- Queue updates broadcast counts via the service worker so other tabs can stay
  in sync.

## Staff experience

1. The onboarding flow checks `navigator.onLine` before submitting.
2. When offline, the submission is queued and the banner switches to
   **“Submission queued for sync”** with the current queue count.
3. The page header metadata also reflects the outstanding queue size
   (`n offline submissions awaiting sync`).
4. Queued banners stay visible until the queue is empty, even if the user
   navigates between steps.

## Background sync

- We request a background sync registration after each queued submission.
- The service worker listens for `OFFLINE_QUEUE_PROCESS` messages and `sync`
  events and calls `syncQueuedOnboarding()`.
- The `/api/member/onboard/sync` route accepts batched payloads and responds
  with per-item statuses so the worker can clear or retry entries.

## Manual verification

- Run `pnpm --filter @ibimina/admin test:component` to cover online vs offline
  onboarding scenarios with Vitest.
- Developers can inspect the queue using browser devtools
  (`Application > IndexedDB > ibimina-onboarding`).
- If troubleshooting, trigger an immediate flush by sending a
  `postMessage({ type: "OFFLINE_QUEUE_PROCESS", reason: "manual" })` to the
  active service worker.
