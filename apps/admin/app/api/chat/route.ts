import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  messages: Message[];
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body: ChatRequestBody = await request.json();

    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: "Invalid request: messages array required" },
        { status: 400 }
      );
    }

    // TODO: Integrate with @ibimina/ai-agent package for actual OpenAI integration
    // For now, return a mocked response based on the user's last message
    const lastUserMessage = body.messages.filter((m) => m.role === "user").pop();

    const mockResponses: Record<string, string> = {
      help: "I can assist you with various SACCO operations including:\n\n• Managing ikimina groups\n• Member registration and management\n• Payment processing and reconciliation\n• Generating reports\n• Understanding platform features\n\nWhat would you like help with?",
      ikimina:
        "To create a new ikimina group:\n\n1. Navigate to the Ikimina section\n2. Click 'Create New Group'\n3. Fill in the group details (name, contribution amount, cycle)\n4. Set up payment rules and schedules\n5. Add members to the group\n\nWould you like more detailed instructions on any of these steps?",
      member:
        "For member management, you can:\n\n• Add new members individually or via bulk import\n• View member contribution history\n• Update member information\n• Manage member status (active/inactive)\n\nWhich operation would you like to perform?",
      payment:
        "Payment processing features include:\n\n• Manual payment recording\n• Mobile money integration\n• Payment reconciliation\n• Payment history tracking\n• Automated payment matching\n\nHow can I assist with payments?",
      report:
        "You can generate various reports:\n\n• Group contribution summaries\n• Member payment histories\n• Financial statements\n• Reconciliation reports\n• Activity logs\n\nWhich report would you like to generate?",
    };

    let responseMessage =
      "I'm here to help! I can assist with ikimina groups, member management, payments, reports, and more. What would you like to know?";

    if (lastUserMessage) {
      const content = lastUserMessage.content.toLowerCase();
      for (const [keyword, response] of Object.entries(mockResponses)) {
        if (content.includes(keyword)) {
          responseMessage = response;
          break;
        }
      }
    }

    return NextResponse.json({
      message: responseMessage,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
