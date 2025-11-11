import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logInfo } from "@/lib/observability/logger";

/**
 * Web Push Notification Subscription API
 *
 * This endpoint handles VAPID-based Web Push notification subscriptions.
 * It supports topic-based subscription management to allow users to subscribe
 * to specific notification categories.
 *
 * VAPID (Voluntary Application Server Identification) is a spec that allows
 * push services to identify the application server that is sending the push.
 */

const SubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  topics: z.array(z.string()).optional().default([]),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = SubscriptionSchema.parse(body);

    // Store the subscription in the database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await supabase.from("push_subscriptions" as any).upsert(
      {
        user_id: user.id,
        endpoint: validatedData.endpoint,
        p256dh_key: validatedData.keys.p256dh,
        auth_key: validatedData.keys.auth,
        topics: validatedData.topics,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,endpoint",
      }
    );

    if (insertError) {
      console.error("Push subscription storage error:", insertError);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to store subscription",
          error: insertError.message,
        },
        { status: 500 }
      );
    }

    logInfo("push_subscription_created", {
      userId: user.id,
      topics: validatedData.topics,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Subscription registered successfully",
        topics: validatedData.topics,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid subscription data",
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("Push subscription error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to register subscription",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return VAPID public key for client-side subscription
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    return NextResponse.json(
      {
        success: false,
        message: "VAPID public key not configured",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    publicKey: vapidPublicKey,
  });
}
