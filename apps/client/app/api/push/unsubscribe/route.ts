import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Web Push Notification Unsubscribe API
 *
 * This endpoint handles unsubscribing from Web Push notifications.
 * Users can unsubscribe from all notifications or specific topics.
 */

const UnsubscribeSchema = z.object({
  endpoint: z.string().url(),
  topics: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = UnsubscribeSchema.parse(body);

    // TODO: In a production environment, you would:
    // 1. Look up the subscription by endpoint in the database
    // 2. If topics are specified, remove only those topics
    // 3. If no topics specified, remove the entire subscription
    // 4. Clean up any orphaned data

    // Example database operations would look like:
    // if (validatedData.topics) {
    //   // Remove specific topics
    //   await supabase.from('push_subscriptions')
    //     .update({
    //       topics: sql`array_remove(topics, ${topic})`
    //     })
    //     .eq('endpoint', validatedData.endpoint);
    // } else {
    //   // Remove entire subscription
    //   await supabase.from('push_subscriptions')
    //     .delete()
    //     .eq('endpoint', validatedData.endpoint);
    // }

    const message = validatedData.topics
      ? `Unsubscribed from topics: ${validatedData.topics.join(", ")}`
      : "Unsubscribed from all notifications";

    return NextResponse.json(
      {
        success: true,
        message,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid unsubscribe data",
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("Push unsubscribe error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to unsubscribe",
      },
      { status: 500 }
    );
  }
}
