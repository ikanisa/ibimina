import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { NfcManager } from "react-native-nfc-manager";

export interface NfcPayload {
  id?: string;
  rawPayload?: string;
}

export interface NfcHookState {
  enabled: boolean;
  latestTag: NfcPayload | null;
  error?: string;
}

function decodePayload(payload?: number[]): string | undefined {
  if (!payload || payload.length === 0) {
    return undefined;
  }
  return String.fromCharCode(...payload)
    .replace(/\u0000/g, "")
    .trim();
}

export function useNfcListener(): NfcHookState {
  const [state, setState] = useState<NfcHookState>({ enabled: false, latestTag: null });

  useEffect(() => {
    let isMounted = true;

    async function initialise() {
      if (Platform.OS !== "android") {
        return;
      }
      try {
        const supported = await NfcManager.isSupported();
        if (!supported) {
          if (!isMounted) return;
          setState((current) => ({ ...current, enabled: false }));
          return;
        }

        await NfcManager.start();
        if (!isMounted) return;
        setState((current) => ({ ...current, enabled: true }));

        await NfcManager.registerTagEvent((tag) => {
          if (!isMounted) return;
          const payload = Array.isArray(tag.ndefMessage) ? tag.ndefMessage[0]?.payload : undefined;
          setState({
            enabled: true,
            latestTag: { id: tag.id, rawPayload: decodePayload(payload) },
          });
        });
      } catch (error) {
        console.error("Failed to initialise NFC", error);
        if (!isMounted) return;
        setState({
          enabled: false,
          latestTag: null,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    void initialise();

    return () => {
      isMounted = false;
      void NfcManager.unregisterTagEvent();
    };
  }, []);

  return state;
}
