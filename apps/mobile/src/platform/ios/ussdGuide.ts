import { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import * as Clipboard from "expo-clipboard";
import { createURL } from "expo-linking";

export interface UssdStep {
  label: string;
  instruction: string;
}

export interface UssdGuideResult {
  steps: UssdStep[];
  copyInstructions: () => Promise<void>;
  dialUrl: string;
}

export function useGuidedUssdCopy(steps: UssdStep[], shortCode: string): UssdGuideResult {
  const trimmedCode = shortCode.trim();

  const dialUrl = useMemo(
    () => createURL(trimmedCode.startsWith("*") ? trimmedCode : `tel:${trimmedCode}`),
    [trimmedCode]
  );

  const copyInstructions = useCallback(async () => {
    if (Platform.OS !== "ios") {
      return;
    }
    const formatted = steps
      .map((step, index) => `${index + 1}. ${step.label}: ${step.instruction}`)
      .join("\n");
    await Clipboard.setStringAsync(`${trimmedCode}\n${formatted}`);
  }, [steps, trimmedCode]);

  return { steps, copyInstructions, dialUrl };
}
