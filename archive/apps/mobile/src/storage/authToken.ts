import * as SecureStore from "expo-secure-store";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV({ id: "ibimina-auth" });
const TOKEN_KEY = "ibimina:auth/token";

export async function saveAuthToken(token: string) {
  storage.set(TOKEN_KEY, token);
  await SecureStore.setItemAsync(TOKEN_KEY, token, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
}

export function getStoredAuthToken() {
  return storage.getString(TOKEN_KEY) ?? null;
}

export async function hydrateAuthToken() {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) {
    storage.set(TOKEN_KEY, token);
  }
  return token ?? null;
}

export function clearAuthToken() {
  storage.delete(TOKEN_KEY);
  SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
}
