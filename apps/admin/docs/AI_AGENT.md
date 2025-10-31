# AI Customer Support Agent

## Overview

The Ibimina AI Customer Support Agent is a world-class autonomous agent powered
by OpenAI's Agents SDK. It provides intelligent, context-aware support for SACCO
staff members with specialized knowledge about platform operations, features,
and troubleshooting.

## Architecture

### Multi-Agent System

The system employs a triage-based multi-agent architecture:

1. **Triage Agent** (Primary)
   - Routes inquiries to specialized agents
   - Handles general questions
   - Manages conversation flow

2. **Billing Specialist**
   - Payment processing questions
   - Transaction troubleshooting
   - Mobile money integration support
   - Financial reconciliation

3. **Technical Support**
   - Authentication issues (MFA, passkeys)
   - System errors and bugs
   - Browser compatibility
   - Offline mode and sync issues

4. **Group Management Specialist**
   - Ikimina (savings groups) operations
   - Member management
   - Group settings and configurations
   - Deposit cycles and schedules

### Agent Tools

The agent has access to several tools to provide accurate, real-time
information:

#### 1. `search_sacco`

Search for SACCO information by name or identifier.

**Parameters:**

- `query`: SACCO name or ID

**Returns:** SACCO details including location, member count, total savings, and
status.

#### 2. `lookup_member`

Look up member information by name, ID, or phone number.

**Parameters:**

- `query`: Member name, ID, or phone number

**Returns:** Member details including groups, balance, and status.

#### 3. `check_transaction`

Check the status of a payment or transaction.

**Parameters:**

- `transactionId`: Transaction ID to query

**Returns:** Transaction details including status, amount, and method.

#### 4. `get_documentation`

Retrieve documentation about platform features.

**Parameters:**

- `topic`: Feature topic (e.g., 'authentication', 'payments', 'groups')

**Returns:** Detailed documentation and help articles.

#### 5. `web_search` (Placeholder)

Search the web for current information about SACCO operations.

**Parameters:**

- `query`: Search query

**Status:** Placeholder for future integration.

#### 6. `get_system_status`

Check the current status of platform systems and services.

**Returns:** Real-time system status for all services.

## User Interface

### Accessing the Agent

Navigate to `/agent` in the admin application to access the AI support
interface.

### Features

- **Real-time messaging**: Instant responses with typing indicators
- **Session persistence**: Conversation history maintained across sessions
- **Agent handoffs**: Seamless transitions between specialized agents
- **Error handling**: Automatic retry on failures
- **Dark mode**: Full dark mode support
- **Responsive design**: Works on desktop and mobile devices

### UI Components

#### AgentChat

Main chat interface component with message history, input, and system status.

#### ChatMessage

Individual message display with role-based styling and timestamps.

#### ChatInput

Message input field with send button and keyboard shortcuts.

## API Endpoints

### POST /api/agent/chat

Send a message to the agent.

**Request Body:**

```json
{
  "sessionId": "string (optional)",
  "message": "string (required)",
  "action": "chat" | "new-session" | "stats"
}
```

**Response:**

```json
{
  "sessionId": "string",
  "message": {
    "id": "string",
    "role": "assistant",
    "content": "string",
    "timestamp": "ISO date string",
    "agentName": "string"
  }
}
```

### GET /api/agent/chat?sessionId=xxx

Retrieve chat history for a session.

**Response:**

```json
{
  "sessionId": "string",
  "messages": [...],
  "createdAt": "ISO date string",
  "lastActivity": "ISO date string"
}
```

## Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=your-openai-api-key

# Optional
OPENAI_RESPONSES_MODEL=gpt-4o  # Default model
```

### Agent Configuration

Edit `/apps/admin/lib/agents/config.ts` to customize:

- System instructions
- Agent personalities
- Tool availability
- Model selection
- Temperature and token limits

### Example Configuration

```typescript
export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  temperature: 0.7, // Response creativity (0-1)
  maxTokens: 2000, // Maximum response length
  enableWebSearch: false, // Enable web search tool
  enableRealtimeAPI: false, // Enable realtime voice API
};
```

## Deployment

### Production Considerations

1. **Session Storage**
   - Current implementation uses in-memory storage
   - For production, migrate to Redis or database
   - Implement session cleanup cron job

2. **Rate Limiting**
   - Add rate limiting to prevent abuse
   - Implement token usage tracking
   - Set up usage alerts

3. **Monitoring**
   - Track conversation quality
   - Monitor response times
   - Log escalations and errors
   - Analyze user satisfaction

4. **Security**
   - Validate all user inputs
   - Implement content filtering
   - Add PII detection and masking
   - Secure tool execution with proper authorization

### Scaling

For high-traffic scenarios:

- Use Redis for session storage
- Implement connection pooling
- Cache frequently accessed data
- Consider load balancing for API routes

## Development

### Adding New Tools

1. Create tool in `/apps/admin/lib/agents/tools.ts`:

```typescript
export const myNewTool = tool({
  name: "my_new_tool",
  description: "What this tool does",
  parameters: z.object({
    param: z.string().describe("Parameter description"),
  }),
  execute: async ({ param }) => {
    // Tool implementation
    return { result: "Tool output" };
  },
});
```

2. Add tool to `allTools` array:

```typescript
export const allTools = [
  searchSaccoTool,
  lookupMemberTool,
  // ... other tools
  myNewTool,
];
```

### Adding New Specialized Agents

1. Create agent in `/apps/admin/lib/agents/config.ts`:

```typescript
export function createMySpecializedAgent(): Agent {
  return new Agent({
    name: "My Specialist",
    instructions: "Specialized instructions...",
    model: "gpt-4o",
    tools: [relevantTool1, relevantTool2],
  });
}
```

2. Add to triage agent's handoffs:

```typescript
const myAgent = createMySpecializedAgent();
return new Agent({
  name: "Support Triage",
  // ... other config
  handoffs: [billingAgent, technicalAgent, myAgent],
});
```

### Testing

Test the agent locally:

```bash
# Start development server
pnpm --filter @ibimina/admin dev

# Navigate to http://localhost:3000/agent

# Test different scenarios:
# - General questions
# - Technical issues
# - Payment inquiries
# - Group management
# - Tool usage
```

## Troubleshooting

### Common Issues

#### "Failed to create session"

- Check OPENAI_API_KEY is set
- Verify API key has sufficient credits
- Check network connectivity

#### Agent not responding

- Check console for errors
- Verify agent configuration
- Test OpenAI API connectivity

#### Tools not working

- Verify tool implementation
- Check tool parameter validation
- Review tool execution logs

### Debug Mode

Enable debug logging:

```typescript
// In runner.ts
console.log("Agent input:", userInput);
console.log("Agent result:", result);
console.log("Tools called:", result.toolCalls);
```

## Roadmap

### Planned Features

- [ ] **Realtime Voice API Integration**
  - Voice input/output support
  - WebRTC streaming
  - Multi-language support

- [ ] **Web Search Integration**
  - Live web search for current information
  - SACCO regulation updates
  - Best practices research

- [ ] **Guardrails**
  - Input validation
  - Output safety checks
  - Content filtering
  - PII detection

- [ ] **Advanced Analytics**
  - Conversation quality metrics
  - Agent performance tracking
  - User satisfaction scores
  - Common issue detection

- [ ] **Proactive Assistance**
  - Contextual help suggestions
  - Workflow guidance
  - Feature discovery

- [ ] **Integration Enhancements**
  - Direct database queries with RLS
  - Real-time transaction updates
  - Member profile access
  - Report generation

## Support

For issues or questions about the AI agent:

1. Check this documentation
2. Review error logs in browser console
3. Contact the development team
4. Submit issues on GitHub

## License

Part of the Ibimina platform. See main repository LICENSE for details.
