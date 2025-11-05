declare module "expo-intent-launcher" {
  export enum ActivityAction {
    DIAL = "android.intent.action.DIAL",
  }
  export function startActivityAsync(
    action: ActivityAction,
    data?: { data?: string }
  ): Promise<void>;
}

declare module "expo-sms" {
  export interface SMSResponse {
    result: "sent" | "cancelled" | "unknown";
  }
  export function sendSMSAsync(recipient: string, message: string): Promise<SMSResponse>;
}

declare module "expo-clipboard" {
  export function setStringAsync(value: string): Promise<void>;
}

declare module "expo-local-authentication" {
  export interface AuthenticationOptions {
    promptMessage?: string;
    cancelLabel?: string;
    disableDeviceFallback?: boolean;
  }
  export interface AuthenticationResult {
    success: boolean;
    error?: string;
  }
  export function hasHardwareAsync(): Promise<boolean>;
  export function isEnrolledAsync(): Promise<boolean>;
  export function authenticateAsync(options?: AuthenticationOptions): Promise<AuthenticationResult>;
}

declare module "expo-file-system" {
  export function writeAsStringAsync(
    fileUri: string,
    contents: string,
    options?: { encoding?: string }
  ): Promise<void>;
  export function getInfoAsync(uri: string): Promise<{ exists: boolean }>;
  export const documentDirectory: string;
}

declare module "expo-print" {
  export interface PrintOptions {
    html: string;
    base64?: boolean;
  }
  export interface PrintResult {
    uri?: string;
    base64?: string;
  }
  export function printToFileAsync(options: PrintOptions): Promise<PrintResult>;
}

declare module "expo-sharing" {
  export function isAvailableAsync(): Promise<boolean>;
  export function shareAsync(
    uri: string,
    options?: { mimeType?: string; dialogTitle?: string }
  ): Promise<void>;
}

declare module "expo-linking" {
  export function createURL(
    path: string,
    options?: { queryParams?: Record<string, string | number | boolean> }
  ): string;
}

declare module "expo-secure-store" {
  export function getItemAsync(key: string): Promise<string | null>;
  export function setItemAsync(key: string, value: string): Promise<void>;
  export function deleteItemAsync(key: string): Promise<void>;
}

declare module "@react-native-async-storage/async-storage" {
  const AsyncStorage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  };
  export default AsyncStorage;
}

declare module "react-native" {
  export const Platform: { OS: "ios" | "android" | "web" };
  export interface NativeEventSubscription {
    remove(): void;
  }
  export namespace Linking {
    function openURL(url: string): Promise<void>;
    function addEventListener(
      type: "url",
      listener: (event: { url: string }) => void
    ): NativeEventSubscription;
  }
  export namespace AccessibilityInfo {
    function isReduceMotionEnabled(): Promise<boolean>;
  }
}

declare module "react-native-haptic-feedback" {
  export type HapticFeedbackType = "impactLight" | "impactMedium" | "impactHeavy";
  export function trigger(
    type: HapticFeedbackType,
    options?: { enableVibrateFallback?: boolean }
  ): void;
}

declare module "react-native-nfc-manager" {
  export interface TagEvent {
    id?: string;
    techTypes?: string[];
    ndefMessage?: Array<{ payload?: number[] }>;
  }
  export interface NfcEvents {
    DiscoverTag: "DiscoverTag";
  }
  export const NfcManager: {
    start(): Promise<void>;
    isSupported(): Promise<boolean>;
    registerTagEvent(callback: (tag: TagEvent) => void): Promise<void>;
    unregisterTagEvent(): Promise<void>;
  };
  export const NfcEvents: NfcEvents;
}
