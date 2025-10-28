import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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
    const body = await request.json();
    const validatedData = SubscriptionSchema.parse(body);

    // TODO: In a production environment, you would:
    // 1. Store the subscription in a database (e.g., Supabase)
    // 2. Associate it with the authenticated user
    // 3. Link it to the requested topics
    // 4. Use web-push library to send notifications later

    // For now, we'll validate and return success
    // Example database storage would look like:
    // await supabase.from('push_subscriptions').insert({
    //   user_id: userId,
    //   endpoint: validatedData.endpoint,
    //   p256dh_key: validatedData.keys.p256dh,
    //   auth_key: validatedData.keys.auth,
    //   topics: validatedData.topics,
    // });

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
