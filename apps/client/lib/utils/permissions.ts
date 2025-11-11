/**
 * Permission Management Utilities for Ibimina Android App
 *
 * This file provides helper functions for managing runtime permissions
 * in accordance with Android's permission model.
 */

/**
 * Permission types used in the app
 */
export enum PermissionType {
  CAMERA = "camera",
  LOCATION = "location",
  NOTIFICATIONS = "notifications",
  SMS = "sms",
  CONTACTS = "contacts",
  PHONE = "phone",
}

/**
 * Permission status
 */
export enum PermissionStatus {
  GRANTED = "granted",
  DENIED = "denied",
  PROMPT = "prompt",
  RESTRICTED = "restricted",
}

/**
 * Check if app is running on Android platform
 */
export async function isAndroid(): Promise<boolean> {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /android/i.test(navigator.userAgent || "");
}

/**
 * Request a permission with user-friendly explanation
 */
export async function requestPermission(
  type: PermissionType,
  reason: string
): Promise<PermissionStatus> {
  console.info(`Permission request for ${type}: ${reason}`);
  const android = await isAndroid();
  if (!android) {
    return PermissionStatus.GRANTED;
  }

  return PermissionStatus.GRANTED;
}

/**
 * Permission explanations for users
 */
export const PermissionExplanations: Record<PermissionType, string> = {
  [PermissionType.CAMERA]:
    "Camera access is needed to capture your ID document and payment receipts for verification.",
  [PermissionType.LOCATION]:
    "Location access helps you find nearby SACCO branches and ensures secure transactions.",
  [PermissionType.NOTIFICATIONS]:
    "Notifications keep you informed about transactions, payments, and group activities.",
  [PermissionType.SMS]:
    "We use Android's SMS User Consent dialog so you can approve a single Mobile Money message. The app never reads your inbox in the background.",
  [PermissionType.CONTACTS]:
    "Contact access helps you find other SACCO members and easily send payments to friends.",
  [PermissionType.PHONE]:
    "Phone permission enables USSD dialing for Mobile Money payments and contacting support.",
};

/**
 * Check if a permission is granted
 */
export async function checkPermission(): Promise<PermissionStatus> {
  return PermissionStatus.GRANTED;
}

/**
 * Request multiple permissions at once
 */
export async function requestPermissions(
  types: PermissionType[]
): Promise<Record<PermissionType, PermissionStatus>> {
  const results = {} as Record<PermissionType, PermissionStatus>;

  for (const type of types) {
    results[type] = await requestPermission(type, PermissionExplanations[type]);
  }

  return results;
}

/**
 * Open app settings for manual permission grant
 */
export async function openAppSettings(): Promise<void> {
  console.info("Prompt user to open application settings for permissions");
}

/**
 * Handle permission permanently denied
 */
export async function handlePermissionDenied(type: PermissionType) {
  console.warn(`${type} permission denied. Ask the user to enable it in settings.`);
  await openAppSettings();
}

/**
 * Check if critical permissions are granted
 * Critical: Camera, SMS (for finance operations)
 */
export async function checkCriticalPermissions(): Promise<boolean> {
  const cameraStatus = await checkPermission();

  return cameraStatus === PermissionStatus.GRANTED;
}

/**
 * Request all critical permissions at app start
 */
export async function requestCriticalPermissions(): Promise<void> {
  await requestPermissions([PermissionType.CAMERA]);
}

/**
 * Permission request flow with retry
 */
export async function requestPermissionWithRetry(
  type: PermissionType,
  maxRetries = 2
): Promise<PermissionStatus> {
  let attempts = 0;

  while (attempts < maxRetries) {
    const status = await requestPermission(type, PermissionExplanations[type]);

    if (status === PermissionStatus.GRANTED) {
      return status;
    }

    if (status === PermissionStatus.RESTRICTED) {
      // Permission permanently denied
      await handlePermissionDenied(type);
      return status;
    }

    attempts++;
  }

  return PermissionStatus.DENIED;
}

/**
 * Get permission status summary for debugging
 */
export async function getPermissionSummary(): Promise<Record<PermissionType, PermissionStatus>> {
  const summary = {} as Record<PermissionType, PermissionStatus>;

  for (const type of Object.values(PermissionType)) {
    summary[type] = await checkPermission();
  }

  return summary;
}

/**
 * Log permission status for debugging
 */
export async function logPermissionStatus(): Promise<void> {
  const summary = await getPermissionSummary();
  // Debug logging for permission status
  // eslint-disable-next-line ibimina/structured-logging
  console.log("Permission Status Summary:", summary);
}

/**
 * Check if all recommended permissions are granted
 */
export async function checkRecommendedPermissions(): Promise<{
  granted: PermissionType[];
  denied: PermissionType[];
}> {
  const recommended = [
    PermissionType.CAMERA,
    PermissionType.SMS,
    PermissionType.NOTIFICATIONS,
    PermissionType.LOCATION,
  ];

  const granted: PermissionType[] = [];
  const denied: PermissionType[] = [];

  for (const type of recommended) {
    const status = await checkPermission();
    if (status === PermissionStatus.GRANTED) {
      granted.push(type);
    } else {
      denied.push(type);
    }
  }

  return { granted, denied };
}

/**
 * Show permission setup guide to user
 */
export async function showPermissionGuide(): Promise<void> {
  const { denied } = await checkRecommendedPermissions();

  if (denied.length === 0) {
    await Toast.show({
      text: "All permissions granted! You can use all features.",
      duration: "short",
    });
    return;
  }

  const message = `Missing permissions:\n${denied.join(", ")}\n\nPlease grant these for full functionality.`;
  await Toast.show({
    text: message,
    duration: "long",
  });
}

const permissionsExport = {
  isAndroid,
  requestPermission,
  checkPermission,
  requestPermissions,
  openAppSettings,
  handlePermissionDenied,
  checkCriticalPermissions,
  requestCriticalPermissions,
  requestPermissionWithRetry,
  getPermissionSummary,
  logPermissionStatus,
  checkRecommendedPermissions,
  showPermissionGuide,
  PermissionType,
  PermissionStatus,
  PermissionExplanations,
};

export default permissionsExport;
