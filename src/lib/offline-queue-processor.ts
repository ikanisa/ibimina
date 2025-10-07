import { QueuedAction } from "./offline-queue-store";

export const processQueuedAction = async (action: QueuedAction): Promise<boolean> => {
  const init: RequestInit = {
    method: action.method,
    headers: action.headers,
  };

  if (action.body) {
    init.body = action.body;
  }

  const response = await fetch(action.url, init);

  if (!response.ok) {
    throw new Error(`Failed to replay queued action: ${response.status}`);
  }

  return true;
};
