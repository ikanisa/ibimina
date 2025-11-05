import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV({ id: "ibimina-secure" });

const namespace = (key: string) => `ibimina:${key}`;

export async function storeHashedIdentifier(key: string, value: string) {
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value.trim());
  storage.set(namespace(key), hashed);
  await SecureStore.setItemAsync(namespace(key), hashed, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
  return hashed;
}

export function getHashedIdentifier(key: string) {
  const hashed = storage.getString(namespace(key));
  return hashed ?? null;
}

export async function syncSecureStore(key: string) {
  const fallback = await SecureStore.getItemAsync(namespace(key));
  if (fallback) {
    storage.set(namespace(key), fallback);
  }
  return fallback ?? null;
}

export function clearIdentifier(key: string) {
  storage.delete(namespace(key));
  SecureStore.deleteItemAsync(namespace(key)).catch(() => {});
}
