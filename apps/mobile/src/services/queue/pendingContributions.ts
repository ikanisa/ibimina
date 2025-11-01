import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { ensureBiometricAccess } from "../../platform/security/biometricGate.js";

const QUEUE_KEY = "@ibimina/pending-contributions";
const FAILED_KEY = "@ibimina/pending-contributions/failed";

export interface ContributionDraft {
  id: string;
  memberId: string;
  amount: number;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface QueueReconciliationResult {
  uploaded: ContributionDraft[];
  failed: ContributionDraft[];
}

async function readQueue(key: string): Promise<ContributionDraft[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ContributionDraft[];
  } catch (error) {
    console.warn("Failed to parse queue state", error);
    await AsyncStorage.removeItem(key);
    return [];
  }
}

async function writeQueue(key: string, items: ContributionDraft[]): Promise<void> {
  if (items.length === 0) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

export async function enqueueContribution(draft: ContributionDraft): Promise<void> {
  const queue = await readQueue(QUEUE_KEY);
  queue.push(draft);
  await writeQueue(QUEUE_KEY, queue);
}

export async function getPendingContributions(): Promise<ContributionDraft[]> {
  return readQueue(QUEUE_KEY);
}

export async function getFailedContributions(): Promise<ContributionDraft[]> {
  return readQueue(FAILED_KEY);
}

export interface ContributionUploader {
  (draft: ContributionDraft): Promise<{ success: boolean; retryable?: boolean }>;
}

export async function reconcilePendingContributions(
  uploader: ContributionUploader
): Promise<QueueReconciliationResult> {
  if (Platform.OS !== "web") {
    await ensureBiometricAccess({ reason: "Confirm offline payments" });
  }

  const queue = await readQueue(QUEUE_KEY);
  const failed: ContributionDraft[] = [];
  const uploaded: ContributionDraft[] = [];

  for (const draft of queue) {
    try {
      const result = await uploader(draft);
      if (result.success) {
        uploaded.push(draft);
      } else if (result.retryable !== false) {
        failed.push(draft);
      }
    } catch (error) {
      console.error("Contribution upload failed", error);
      failed.push(draft);
    }
  }

  await writeQueue(QUEUE_KEY, failed);
  await writeQueue(FAILED_KEY, failed);
  await SecureStore.setItemAsync(
    "@ibimina/pending-contributions/summary",
    JSON.stringify({
      lastSyncedAt: new Date().toISOString(),
      uploaded: uploaded.length,
      failed: failed.length,
    })
  );

  return { uploaded, failed };
}

export async function clearPendingContributions(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(QUEUE_KEY),
    AsyncStorage.removeItem(FAILED_KEY),
    SecureStore.deleteItemAsync("@ibimina/pending-contributions/summary"),
  ]);
}
