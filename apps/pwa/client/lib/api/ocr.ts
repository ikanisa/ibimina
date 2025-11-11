/**
 * Client-side API wrapper for OCR operations
 *
 * This module provides a type-safe interface for uploading identity documents
 * and receiving OCR (Optical Character Recognition) extracted data.
 *
 * Current implementation uses a stub API that returns mocked data for
 * development and testing purposes.
 *
 * Usage:
 * ```typescript
 * import { uploadIDDocument } from '@/lib/api/ocr';
 *
 * const file = event.target.files[0];
 * const result = await uploadIDDocument(file, 'NID');
 * console.log('Extracted ID number:', result.data.id_number);
 * ```
 */

/**
 * Supported identity document types
 */
export type IDType = "NID" | "DL" | "PASSPORT";

/**
 * Extracted OCR data from identity document
 */
export interface OCRData {
  /** Type of identity document */
  id_type: string;
  /** Extracted ID number */
  id_number: string;
  /** Full name as it appears on document */
  full_name: string;
  /** Date of birth in YYYY-MM-DD format */
  date_of_birth: string;
  /** OCR confidence score (0-1, where 1 is highest confidence) */
  confidence: number;
  /** Additional extracted fields specific to document type */
  extracted_fields: {
    detected_language: string;
    document_quality: string;
    text_regions: Array<{
      text: string;
      confidence: number;
    }>;
  };
  /** Additional fields that may vary by document type */
  [key: string]: unknown;
}

/**
 * Response from OCR upload API
 */
export interface OCRUploadResponse {
  success: boolean;
  /** Indicates if this is a stub/mocked response */
  stub?: boolean;
  message?: string;
  /** Extracted OCR data */
  data: OCRData;
  /** Information about the uploaded file */
  file_info: {
    name: string;
    size: number;
    type: string;
  };
}

/**
 * Error response from OCR API
 */
export interface OCRError {
  error: string;
  details: string;
}

/**
 * Uploads an identity document for OCR processing
 *
 * This function sends a multipart/form-data request to /api/ocr/upload with
 * the provided image file. The API currently returns mocked data (stub).
 *
 * @param file - Image file of the identity document
 * @param idType - Type of ID: 'NID' (National ID), 'DL' (Driver's License), or 'PASSPORT'
 * @returns Promise resolving to OCR extracted data
 * @throws Error if upload fails or file is invalid
 *
 * File requirements:
 * - Format: JPEG, PNG, or WebP
 * - Maximum size: 10MB
 * - Should be clear and legible
 *
 * @example
 * ```typescript
 * const fileInput = document.querySelector('input[type="file"]');
 * const file = fileInput.files[0];
 *
 * try {
 *   const result = await uploadIDDocument(file, 'NID');
 *   if (result.stub) {
 *     console.log('Using mocked data for development');
 *   }
 *   console.log('ID Number:', result.data.id_number);
 *   console.log('Name:', result.data.full_name);
 *   console.log('Confidence:', (result.data.confidence * 100).toFixed(1) + '%');
 * } catch (error) {
 *   console.error('OCR failed:', error.message);
 * }
 * ```
 */
export async function uploadIDDocument(
  file: File,
  idType: IDType = "NID"
): Promise<OCRUploadResponse> {
  // Client-side validation
  if (!file) {
    throw new Error("No file provided");
  }

  // Validate file size (10MB limit)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error(`File size must not exceed ${MAX_SIZE / 1024 / 1024}MB`);
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only JPEG, PNG, and WebP images are supported");
  }

  try {
    // Prepare form data
    const formData = new FormData();
    formData.append("file", file);
    formData.append("id_type", idType);

    // Send request
    const response = await fetch("/api/ocr/upload", {
      method: "POST",
      body: formData,
      // Ensure credentials (cookies) are included
      credentials: "include",
    });

    const result = await response.json();

    // Handle error responses
    if (!response.ok) {
      const errorData = result as OCRError;
      throw new Error(errorData.details || errorData.error || "OCR processing failed");
    }

    return result as OCRUploadResponse;
  } catch (error) {
    // Provide more context for network errors
    if (error instanceof TypeError) {
      throw new Error(
        "Network error: Unable to connect to the server. Please check your internet connection."
      );
    }

    // Re-throw other errors
    throw error;
  }
}

/**
 * Validates if a file is suitable for OCR processing
 *
 * This function performs client-side validation before upload to provide
 * immediate feedback to users.
 *
 * @param file - File to validate
 * @returns Object with isValid flag and error message if invalid
 *
 * @example
 * ```typescript
 * const validation = validateIDFile(file);
 * if (!validation.isValid) {
 *   alert(validation.error);
 *   return;
 * }
 * // Proceed with upload
 * ```
 */
export function validateIDFile(file: File): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: "No file selected" };
  }

  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return {
      isValid: false,
      error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`,
    };
  }

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Invalid file type. Please upload a JPEG, PNG, or WebP image.",
    };
  }

  return { isValid: true };
}
