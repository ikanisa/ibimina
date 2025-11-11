/**
 * Device Authentication Module
 *
 * Provides device-bound authentication for staff mobile app
 */

export { DeviceAuthManager, deviceAuthManager, DeviceAuth } from "./manager";
export type {
  DeviceAuthPlugin,
  ChallengeData,
  SignedMessage,
  DeviceEnrollmentData,
  RegisteredDevice,
} from "./types";
