/**
 * Client-side API wrapper for onboarding operations
 *
 * This module provides a type-safe interface for interacting with the
 * onboarding API endpoint. It handles request formatting, error handling,
 * and response parsing.
 *
 * Usage:
 * ```typescript
 * import { submitOnboardingData } from '@/lib/api/onboard';
 *
 * try {
 *   const result = await submitOnboardingData({
 *     whatsapp_msisdn: '+250788123456',
 *     momo_msisdn: '+250788123456',
 *   });
 *   console.log('Profile created:', result);
 * } catch (error) {
 *   console.error('Onboarding failed:', error);
 * }
 * ```
 */

/**
 * Request payload for onboarding submission
 */
export interface OnboardingData {
  /** WhatsApp phone number in E.164 format (+250XXXXXXXXX) */
  whatsapp_msisdn: string;
  /** Mobile Money phone number in E.164 format (+250XXXXXXXXX) */
  momo_msisdn: string;
  /** Preferred language code (optional, defaults to 'en') */
  lang?: string;
}

/**
 * Response from successful onboarding submission
 */
export interface OnboardingResponse {
  success: true;
  data: {
    user_id: string;
    whatsapp_msisdn: string;
    momo_msisdn: string;
    lang: string;
    created_at: string;
  };
}

/**
 * Error response from onboarding API
 */
export interface OnboardingError {
  error: string;
  details: string;
}

/**
 * Submits onboarding data to create a new member profile
 *
 * This function sends a POST request to /api/onboard with the provided
 * contact information. The user must be authenticated before calling this.
 *
 * @param data - Onboarding information including phone numbers
 * @returns Promise resolving to the created profile data
 * @throws Error if the request fails or returns an error response
 *
 * @example
 * ```typescript
 * const profile = await submitOnboardingData({
 *   whatsapp_msisdn: '+250788123456',
 *   momo_msisdn: '+250788654321',
 *   lang: 'en'
 * });
 * console.log('Profile ID:', profile.data.user_id);
 * ```
 */
export async function submitOnboardingData(data: OnboardingData): Promise<OnboardingResponse> {
  try {
    const response = await fetch("/api/onboard", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      // Ensure credentials (cookies) are included in the request
      credentials: "include",
    });

    const result = await response.json();

    // Handle error responses
    if (!response.ok) {
      const errorData = result as OnboardingError;
      throw new Error(errorData.details || errorData.error || "Onboarding failed");
    }

    return result as OnboardingResponse;
  } catch (error) {
    // Re-throw with more context if it's a network error
    if (error instanceof TypeError) {
      throw new Error(
        "Network error: Unable to connect to the server. Please check your internet connection."
      );
    }

    // Re-throw other errors as-is
    throw error;
  }
}

/**
 * Checks if a member profile already exists for the current user
 *
 * This can be used to determine if the user should be redirected to
 * onboarding or allowed to proceed to the main app.
 *
 * @returns Promise resolving to true if profile exists, false otherwise
 *
 * Note: This is a placeholder function. Implement when profile check
 * endpoint is available.
 */
export async function checkProfileExists(): Promise<boolean> {
  // TODO: Implement when profile check endpoint is created
  // For now, we rely on the onboarding endpoint's 409 response
  return false;
}
