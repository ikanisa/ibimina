/**
 * OCR Upload API Route Handler (Stub Implementation)
 *
 * POST /api/ocr/upload
 *
 * This is a stub implementation that simulates OCR (Optical Character Recognition)
 * processing of identity documents. In a production environment, this would integrate
 * with an actual OCR service to extract text from uploaded ID images.
 *
 * Current behavior:
 * - Accepts file uploads (simulated)
 * - Returns mocked OCR data for development/testing
 * - Validates request structure
 *
 * Request:
 * - Content-Type: multipart/form-data
 * - file: File (image of ID document)
 * - id_type: string (optional) - Type of ID: 'NID', 'DL', or 'PASSPORT'
 *
 * Response:
 * - 200: OCR processing successful (mocked data)
 * - 400: Invalid request or missing file
 * - 401: User not authenticated
 * - 413: File too large
 * - 500: Server error
 *
 * Mocked OCR Response Structure:
 * {
 *   success: true,
 *   data: {
 *     id_type: string,
 *     id_number: string,
 *     full_name: string,
 *     date_of_birth: string,
 *     confidence: number (0-1),
 *     extracted_fields: object
 *   }
 * }
 *
 * Security:
 * - Requires valid Supabase session
 * - File size limits enforced (max 10MB)
 * - File type validation (images only)
 *
 * TODO for production:
 * - Integrate with actual OCR service (e.g., Google Vision API, AWS Textract)
 * - Implement secure file upload to cloud storage
 * - Add virus scanning for uploaded files
 * - Store OCR results in members_app_profiles.ocr_json
 * - Implement retry logic for failed OCR attempts
 * - Add audit logging for all OCR operations
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logInfo } from "@/lib/observability/logger";

/**
 * Maximum file size for uploads (10MB)
 * Adjust based on requirements and infrastructure limits
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Allowed image MIME types for ID document uploads
 */
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

/**
 * Generates mocked OCR data for testing
 * In production, this would be replaced with actual OCR service integration
 */
function generateMockedOCRData(idType: string = "NID") {
  // Simulate processing delay
  const confidence = 0.92 + Math.random() * 0.07; // 92-99% confidence

  // Mocked data based on ID type
  const mockData = {
    NID: {
      id_type: "NID",
      id_number: `1199780${Math.floor(Math.random() * 1000000)}`,
      full_name: "MUGISHA Jean Paul",
      date_of_birth: "1997-08-15",
      place_of_birth: "Kigali",
      sex: "M",
      nationality: "Rwandan",
      issue_date: "2020-01-10",
      expiry_date: "2030-01-09",
    },
    DL: {
      id_type: "DL",
      id_number: `DL${Math.floor(Math.random() * 10000000)}`,
      full_name: "MUKAMANA Marie",
      date_of_birth: "1995-03-22",
      license_category: "B",
      issue_date: "2019-06-15",
      expiry_date: "2024-06-14",
    },
    PASSPORT: {
      id_type: "PASSPORT",
      id_number: `PC${Math.floor(Math.random() * 10000000)}`,
      full_name: "UWIMANA Grace",
      date_of_birth: "1992-11-08",
      nationality: "Rwandan",
      place_of_birth: "Kigali",
      sex: "F",
      issue_date: "2021-02-20",
      expiry_date: "2031-02-19",
    },
  };

  const data = mockData[idType as keyof typeof mockData] || mockData.NID;

  return {
    ...data,
    confidence,
    extracted_fields: {
      detected_language: "en",
      document_quality: "high",
      text_regions: [
        { text: data.full_name, confidence: 0.98 },
        { text: data.id_number, confidence: 0.95 },
      ],
    },
  };
}

/**
 * Process OCR using available service (OpenAI or Google Vision)
 */
async function processOCRWithService(imageUrl: string, idType: string) {
  // Try OpenAI Vision API first (GPT-4 Vision)
  if (process.env.OPENAI_API_KEY) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extract the following information from this Rwanda ${idType} document: ID number, full name, date of birth. Return as JSON with fields: id_number, full_name, date_of_birth. Be precise and only return the JSON object.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const extracted = JSON.parse(jsonMatch[0]);
      return {
        id_type: idType,
        id_number: extracted.id_number || "",
        full_name: extracted.full_name || "",
        date_of_birth: extracted.date_of_birth || "",
        confidence: 0.9,
        extracted_fields: extracted,
        ocr_service: "openai",
      };
    }
  }

  // Try Google Vision API as fallback
  if (process.env.GOOGLE_VISION_API_KEY) {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { source: { imageUri: imageUrl } },
              features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google Vision API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.responses?.[0]?.fullTextAnnotation?.text || "";

    // Parse ID document based on type
    return parseIdDocument(text, idType);
  }

  throw new Error("No OCR service configured");
}

/**
 * Parse text extracted from ID document
 */
function parseIdDocument(text: string, idType: string) {
  // Rwanda National ID format: 16 digits
  const nidMatch = text.match(/\b\d{16}\b/);

  // Name (usually in caps)
  const nameMatch = text.match(/([A-Z]{2,}\s+[A-Z]{2,}(?:\s+[A-Z]{2,})?)/);

  // Date (DD/MM/YYYY or similar)
  const dateMatch = text.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{4})/);

  return {
    id_type: idType,
    id_number: nidMatch?.[0] || "",
    full_name: nameMatch?.[0] || "",
    date_of_birth: dateMatch?.[0]?.replace(/[\/\-]/g, "-") || "",
    confidence: 0.85,
    extracted_fields: { nidMatch, nameMatch, dateMatch },
    raw_text: text,
    ocr_service: "google-vision",
  };
}

/**
 * POST handler for OCR upload
 * Currently returns mocked data; to be replaced with actual OCR integration
 */
export async function POST(request: Request) {
  try {
    // Initialize Supabase client with user session
    const supabase = await createSupabaseServerClient();

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required", details: "Please sign in to continue" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const idType = (formData.get("id_type") as string) || "NID";

    // Validate file presence
    if (!file) {
      return NextResponse.json(
        { error: "Missing file", details: "Please provide an ID document image" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "File too large",
          details: `File size must not exceed ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 413 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type",
          details: "Only JPEG, PNG, and WebP images are allowed",
        },
        { status: 400 }
      );
    }

    // Validate ID type
    const validIdTypes = ["NID", "DL", "PASSPORT"];
    if (!validIdTypes.includes(idType)) {
      return NextResponse.json(
        {
          error: "Invalid ID type",
          details: `ID type must be one of: ${validIdTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}_${idType}.${fileExt}`;
    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("id-documents")
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[OCR Upload] Storage error:", uploadError);
      return NextResponse.json(
        {
          error: "File upload failed",
          details: uploadError.message,
        },
        { status: 500 }
      );
    }

    // Get public URL for the uploaded file
    const {
      data: { publicUrl },
    } = supabase.storage.from("id-documents").getPublicUrl(fileName);

    // Process with OCR service (or use mock data if OCR not configured)
    let ocrResult;
    if (process.env.OPENAI_API_KEY || process.env.GOOGLE_VISION_API_KEY) {
      try {
        ocrResult = await processOCRWithService(publicUrl, idType);
      } catch (error) {
        console.error("[OCR] Service error:", error);
        // Fall back to mock data if OCR service fails
        ocrResult = generateMockedOCRData(idType);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ocrResult as any).ocr_service_error =
          error instanceof Error ? error.message : String(error);
      }
    } else {
      console.warn("[OCR] No OCR service configured, using mock data");
      ocrResult = generateMockedOCRData(idType);
    }

    // Store OCR result in database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileError } = await supabase.from("members_app_profiles" as any).upsert(
      {
        user_id: user.id,
        id_type: idType as "NID" | "DL" | "PASSPORT",
        id_number: ocrResult.id_number,
        id_document_url: publicUrl,
        id_document_path: fileName,
        ocr_json: ocrResult,
        ocr_confidence: ocrResult.confidence,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

    if (profileError) {
      console.error("[OCR Upload] Profile update error:", profileError);
      // Don't fail the request - file is uploaded successfully
    }

    // Log successful operation
    logInfo("ocr_upload_success", {
      userId: user.id,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      storedAt: fileName,
    });

    // Return success response with OCR data
    return NextResponse.json(
      {
        success: true,
        message: "OCR processing completed",
        data: ocrResult,
        file_info: {
          name: file.name,
          size: file.size,
          type: file.type,
          url: publicUrl,
          path: fileName,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("OCR upload error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
