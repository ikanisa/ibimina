# AI Agent Quick Start Guide

## Prerequisites

Before using the AI support agent, ensure:

1. ✅ OpenAI API key is configured in `.env`:

   ```bash
   OPENAI_API_KEY=sk-...your-key-here...
   ```

2. ✅ Dependencies are installed:

   ```bash
   pnpm install
   ```

3. ✅ Development server is running:
   ```bash
   pnpm --filter @ibimina/admin dev
   ```

## Access the Agent

1. Navigate to: `http://localhost:3000/agent`

2. You'll see a chat interface with a welcome message

3. Start typing your question and press Enter or click Send

## Example Conversations

### General Information

**You:** "What is Ibimina?"

**Agent:** Explains the platform's purpose and features.

### Technical Support

**You:** "I'm having trouble logging in with my passkey"

**Agent:** → Hands off to Technical Support specialist Provides troubleshooting
steps for passkey authentication.

### Payment Questions

**You:** "How do I check the status of a transaction?"

**Agent:** → Hands off to Billing Specialist Explains transaction lookup and
provides guidance.

### Group Management

**You:** "How do I create a new savings group?"

**Agent:** → Hands off to Group Management Specialist Walks through the group
creation process.

## Features to Try

### 1. Tool Usage

Ask questions that require information lookup:

- "Search for SACCO in Kigali"
- "Look up member with ID M12345"
- "Check transaction status for TX123"
- "Show me documentation about authentication"

### 2. Agent Handoffs

Notice how the agent automatically routes to specialists:

- Payment questions → Billing Specialist
- Technical issues → Technical Support
- Group operations → Group Management Specialist

### 3. Session Persistence

Your conversation history is maintained throughout the session. Refresh the page
and start a new conversation to see a clean slate.

### 4. Error Handling

Try:

- Sending a message while offline
- Using the retry button if a message fails
- Observing the loading states

## Tips for Best Results

1. **Be Specific**: Instead of "payment issue", try "I can't process a mobile
   money deposit"

2. **Use Context**: Reference previous messages in your conversation

3. **Ask Follow-ups**: The agent maintains context across messages

4. **Try Different Topics**: Test various types of questions to see agent
   handoffs

## Keyboard Shortcuts

- `Enter`: Send message
- `Shift+Enter`: New line in message
- Arrow keys: Navigate message history (when input is empty)

## Troubleshooting

### Agent not responding?

1. Check browser console for errors (F12)
2. Verify OPENAI_API_KEY is set correctly
3. Check your OpenAI API quota/credits
4. Refresh the page and try again

### Session issues?

1. Clear browser cache
2. Start a new session
3. Check API route logs

### UI not loading?

1. Verify all dependencies installed
2. Check for build errors
3. Restart development server

## Next Steps

- Read the full [AI Agent Documentation](./AI_AGENT.md)
- Customize agent instructions in `lib/agents/config.ts`
- Add new tools in `lib/agents/tools.ts`
- Implement session persistence with Redis/database

## Need Help?

The AI agent itself can answer questions about its capabilities! Just ask:

- "What can you help me with?"
- "What tools do you have access to?"
- "How do I get help with [specific topic]?"

---

**Ready to go?** Visit `/agent` and start chatting! 🚀
