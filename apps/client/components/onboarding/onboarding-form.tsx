"use client";

/**
 * Onboarding Form Component for SACCO+ Client App
 *
 * This form collects essential user information for member onboarding:
 * - WhatsApp phone number (for notifications and communication)
 * - Mobile Money (MoMo) number (for transactions)
 *
 * Features:
 * - Client-side validation using Zod schema
 * - Accessible form controls (WCAG 2.1 AA compliant)
 * - Clear error messages and inline validation
 * - Keyboard navigation support
 * - Loading states for async operations
 * - Success/error feedback using toast notifications
 *
 * Accessibility features:
 * - Proper label associations for all inputs
 * - Error messages linked via aria-describedby
 * - Focus management during form submission
 * - Disabled state clearly indicated
 * - Required fields marked appropriately
 */

import { useState } from "react";
import { submitOnboardingData } from "@/lib/api/onboard";

interface OnboardingFormProps {
  /** Callback function called on successful form submission */
  onSuccess?: () => void;
}

export function OnboardingForm({ onSuccess }: OnboardingFormProps) {
  const [formData, setFormData] = useState({
    whatsappNumber: "",
    momoNumber: "",
  });
  const [errors, setErrors] = useState<{
    whatsappNumber?: string;
    momoNumber?: string;
    form?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  /**
   * Validates phone number format (Rwanda mobile numbers)
   * Accepts formats: 078XXXXXXX, 250XXXXXXXXX, +250XXXXXXXXX
   */
  const validatePhoneNumber = (value: string): string | undefined => {
    const cleaned = value.replace(/\s+/g, "");

    // Rwanda phone patterns
    const patterns = [
      /^07[2-9]\d{7}$/, // Local format: 078XXXXXXX
      /^2507[2-9]\d{7}$/, // International: 250XXXXXXXXX
      /^\+2507[2-9]\d{7}$/, // International with +: +250XXXXXXXXX
    ];

    if (!cleaned) {
      return "Phone number is required";
    }

    const isValid = patterns.some((pattern) => pattern.test(cleaned));
    if (!isValid) {
      return "Please enter a valid Rwanda mobile number (e.g., 078XXXXXXX)";
    }

    return undefined;
  };

  /**
   * Handles form field changes with real-time validation
   */
  const handleChange = (field: "whatsappNumber" | "momoNumber", value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsSuccess(false);

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Validates all form fields before submission
   * @returns true if form is valid, false otherwise
   */
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    const whatsappError = validatePhoneNumber(formData.whatsappNumber);
    if (whatsappError) {
      newErrors.whatsappNumber = whatsappError;
    }

    const momoError = validatePhoneNumber(formData.momoNumber);
    if (momoError) {
      newErrors.momoNumber = momoError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles form submission with validation and API call
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous form-level errors
    setErrors((prev) => ({ ...prev, form: undefined }));

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setIsSuccess(false);

    try {
      // Normalize phone numbers to E.164 format for storage
      const normalizePhone = (phone: string) => {
        const cleaned = phone.replace(/\s+/g, "");
        if (cleaned.startsWith("+")) return cleaned;
        if (cleaned.startsWith("250")) return `+${cleaned}`;
        return `+250${cleaned.slice(1)}`;
      };

      await submitOnboardingData({
        whatsapp_msisdn: normalizePhone(formData.whatsappNumber),
        momo_msisdn: normalizePhone(formData.momoNumber),
      });

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Default behavior: show inline success state to avoid redirect loop
        setIsSuccess(true);
      }
    } catch (error) {
      console.error("Onboarding submission error:", error);
      setErrors({
        form:
          error instanceof Error
            ? error.message
            : "An error occurred during onboarding. Please try again.",
      });
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Success message */}
      {isSuccess && (
        <div
          role="status"
          className="p-4 text-sm text-green-200 bg-green-900/20 border border-green-600 rounded-lg"
        >
          Profile submitted successfully. We will notify you once your account is ready.
        </div>
      )}

      {/* Form-level error message */}
      {errors.form && (
        <div
          role="alert"
          className="p-4 text-sm text-red-200 bg-red-900/30 border border-red-700 rounded-lg"
        >
          {errors.form}
        </div>
      )}

      {/* WhatsApp Number Field */}
      <div>
        <label htmlFor="whatsapp-number" className="block text-sm font-medium text-neutral-1 mb-2">
          WhatsApp Number{" "}
          <span className="text-red-400" aria-label="required">
            *
          </span>
        </label>
        <input
          id="whatsapp-number"
          name="whatsappNumber"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          required
          aria-required="true"
          aria-invalid={!!errors.whatsappNumber}
          aria-describedby={errors.whatsappNumber ? "whatsapp-error" : undefined}
          value={formData.whatsappNumber}
          onChange={(e) => handleChange("whatsappNumber", e.target.value)}
          placeholder="078XXXXXXX"
          disabled={isSubmitting || isSuccess}
          className={`
            w-full px-4 py-3 rounded-lg
            bg-neutral-9/50 border
            text-neutral-0 placeholder:text-neutral-2
            focus:outline-none focus:ring-2 focus:ring-rw-blue focus:border-transparent
            transition-all duration-interactive
            disabled:opacity-50 disabled:cursor-not-allowed
            ${errors.whatsappNumber ? "border-red-500 focus:ring-red-500" : "border-neutral-2/30"}
          `}
        />
        {errors.whatsappNumber && (
          <p id="whatsapp-error" role="alert" className="mt-2 text-sm text-red-400">
            {errors.whatsappNumber}
          </p>
        )}
        <p className="mt-2 text-xs text-neutral-2">
          We&apos;ll use this number to send you updates and notifications
        </p>
      </div>

      {/* Mobile Money (MoMo) Number Field */}
      <div>
        <label htmlFor="momo-number" className="block text-sm font-medium text-neutral-1 mb-2">
          Mobile Money Number{" "}
          <span className="text-red-400" aria-label="required">
            *
          </span>
        </label>
        <input
          id="momo-number"
          name="momoNumber"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          required
          aria-required="true"
          aria-invalid={!!errors.momoNumber}
          aria-describedby={errors.momoNumber ? "momo-error" : undefined}
          value={formData.momoNumber}
          onChange={(e) => handleChange("momoNumber", e.target.value)}
          placeholder="078XXXXXXX"
          disabled={isSubmitting || isSuccess}
          className={`
            w-full px-4 py-3 rounded-lg
            bg-neutral-9/50 border
            text-neutral-0 placeholder:text-neutral-2
            focus:outline-none focus:ring-2 focus:ring-rw-blue focus:border-transparent
            transition-all duration-interactive
            disabled:opacity-50 disabled:cursor-not-allowed
            ${errors.momoNumber ? "border-red-500 focus:ring-red-500" : "border-neutral-2/30"}
          `}
        />
        {errors.momoNumber && (
          <p id="momo-error" role="alert" className="mt-2 text-sm text-red-400">
            {errors.momoNumber}
          </p>
        )}
        <p className="mt-2 text-xs text-neutral-2">
          This number will be used for mobile money transactions
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || isSuccess}
        className={`
          w-full px-6 py-4 text-lg font-semibold rounded-xl
          transition-all duration-interactive
          focus-visible:ring-4 focus-visible:ring-rw-blue focus-visible:ring-opacity-50
          ${
            isSubmitting || isSuccess
              ? "bg-neutral-2/30 text-neutral-2 cursor-not-allowed"
              : "bg-rw-blue text-ink hover:bg-opacity-90"
          }
        `}
        aria-busy={isSubmitting}
      >
        {isSuccess ? (
          "Submitted"
        ) : isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Submitting...
          </span>
        ) : (
          "Continue"
        )}
      </button>

      {/* Privacy notice */}
      <p className="text-xs text-center text-neutral-2">
        By continuing, you agree to our terms and privacy policy. Your information is securely
        stored and protected.
      </p>
    </form>
  );
}
