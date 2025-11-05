import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const HOME_CACHE_KEY = "@ibimina/cache/home";
const PAY_CACHE_KEY = "@ibimina/cache/pay";
const CACHE_VERSION = 1;

interface CacheEnvelope<T> {
  version: number;
  timestamp: number;
  payload: T;
}

export interface HomeSnapshot {
  memberId: string;
  balance: number;
  upcomingMeetings: Array<{ id: string; date: string; title: string }>;
}

export interface PaySnapshot {
  memberId: string;
  recentRecipients: Array<{ memberId: string; name: string; amount: number; lastPaidOn: string }>;
  suggestedAmount?: number;
}

async function writeCache<T>(key: string, value: CacheEnvelope<T>): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

async function readCache<T>(key: string): Promise<CacheEnvelope<T> | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (parsed.version !== CACHE_VERSION) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch (error) {
    console.error("Failed to parse offline cache", error);
    await AsyncStorage.removeItem(key);
    return null;
  }
}

export async function getCachedHomeSnapshot(): Promise<HomeSnapshot | null> {
  const cached = await readCache<HomeSnapshot>(HOME_CACHE_KEY);
  return cached?.payload ?? null;
}

export async function setCachedHomeSnapshot(snapshot: HomeSnapshot): Promise<void> {
  await writeCache(HOME_CACHE_KEY, {
    version: CACHE_VERSION,
    timestamp: Date.now(),
    payload: snapshot,
  });
}

export async function getCachedPaySnapshot(): Promise<PaySnapshot | null> {
  const cached = await readCache<PaySnapshot>(PAY_CACHE_KEY);
  return cached?.payload ?? null;
}

export async function setCachedPaySnapshot(snapshot: PaySnapshot): Promise<void> {
  await writeCache(PAY_CACHE_KEY, {
    version: CACHE_VERSION,
    timestamp: Date.now(),
    payload: snapshot,
  });
}

export async function clearOfflineState(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(HOME_CACHE_KEY),
    AsyncStorage.removeItem(PAY_CACHE_KEY),
    SecureStore.deleteItemAsync("@ibimina/offline/queueDigest"),
  ]);
}

export async function snapshotCacheDigest(): Promise<void> {
  const [home, pay] = await Promise.all([
    readCache<HomeSnapshot>(HOME_CACHE_KEY),
    readCache<PaySnapshot>(PAY_CACHE_KEY),
  ]);

  const digest = JSON.stringify({
    homeTimestamp: home?.timestamp ?? null,
    payTimestamp: pay?.timestamp ?? null,
  });

  await SecureStore.setItemAsync("@ibimina/offline/queueDigest", digest);
}

export async function readCacheDigest(): Promise<{
  homeTimestamp: number | null;
  payTimestamp: number | null;
} | null> {
  const digest = await SecureStore.getItemAsync("@ibimina/offline/queueDigest");
  if (!digest) return null;
  try {
    return JSON.parse(digest) as { homeTimestamp: number | null; payTimestamp: number | null };
  } catch (error) {
    console.warn("Failed to parse cache digest", error);
    await SecureStore.deleteItemAsync("@ibimina/offline/queueDigest");
    return null;
  }
}
