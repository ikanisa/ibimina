import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logInfo } from "@/lib/observability/logger";

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
    const validatedData = UnsubscribeSchema.parse(body);

    if (validatedData.topics && validatedData.topics.length > 0) {
      // Remove specific topics - fetch current subscription first
      const { data: subscription, error: fetchError } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("push_subscriptions" as any)
        .select("topics")
        .eq("user_id", user.id)
        .eq("endpoint", validatedData.endpoint)
        .single();

      if (fetchError || !subscription) {
        return NextResponse.json(
          {
            success: false,
            message: "Subscription not found",
          },
          { status: 404 }
        );
      }

      // Filter out the topics to remove
      const currentTopics = ((subscription as any).topics as string[]) || []; // eslint-disable-line @typescript-eslint/no-explicit-any
      const remainingTopics = currentTopics.filter(
        (topic: string) => !validatedData.topics?.includes(topic)
      );

      // Update with remaining topics
      const { error: updateError } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("push_subscriptions" as any)
        .update({
          topics: remainingTopics,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("endpoint", validatedData.endpoint);

      if (updateError) {
        console.error("Push topic removal error:", updateError);
        return NextResponse.json(
          {
            success: false,
            message: "Failed to update subscription",
            error: updateError.message,
          },
          { status: 500 }
        );
      }

      logInfo("push_topic_unsubscribed", {
        userId: user.id,
        topics: validatedData.topics,
      });

      return NextResponse.json(
        {
          success: true,
          message: `Unsubscribed from topics: ${validatedData.topics.join(", ")}`,
        },
        { status: 200 }
      );
    } else {
      // Remove entire subscription
      const { error: deleteError } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("push_subscriptions" as any)
        .delete()
        .eq("user_id", user.id)
        .eq("endpoint", validatedData.endpoint);

      if (deleteError) {
        console.error("Push subscription removal error:", deleteError);
        return NextResponse.json(
          {
            success: false,
            message: "Failed to remove subscription",
            error: deleteError.message,
          },
          { status: 500 }
        );
      }

      logInfo("push_fully_unsubscribed", {
        userId: user.id,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Unsubscribed from all notifications",
        },
        { status: 200 }
      );
    }
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
