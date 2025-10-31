# AI Agent Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         IBIMINA AI SUPPORT AGENT                             │
│                    Autonomous Customer Support System                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Admin Panel Navigation                                              │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐     ┌─────────────────────┐     │  │
│  │  │ SACCOs │ │ Groups │ │ Members│ ... │ 🤖 AI Support      │     │  │
│  │  └────────┘ └────────┘ └────────┘     └─────────────────────┘     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  /agent - Chat Interface (AgentChat.tsx)                            │  │
│  │  ┌────────────────────────────────────────────────────────────────┐ │  │
│  │  │  Header: AI Support Assistant [Online]                         │ │  │
│  │  ├────────────────────────────────────────────────────────────────┤ │  │
│  │  │  Messages Area (scrollable)                                    │ │  │
│  │  │                                                                 │ │  │
│  │  │  ┌─────────┐  "Hello! How can I help you today?"               │ │  │
│  │  │  │ 🤖 Bot  │  [Support Triage]                                 │ │  │
│  │  │  └─────────┘                                                    │ │  │
│  │  │                                                                 │ │  │
│  │  │               "How do I create a savings group?" ┌──────────┐  │ │  │
│  │  │                                                   │ 👤 User  │  │ │  │
│  │  │                                                   └──────────┘  │ │  │
│  │  │                                                                 │ │  │
│  │  │  ┌─────────┐  "I'll help you with that..."                     │ │  │
│  │  │  │ 🤖 Bot  │  [Group Management Specialist]                    │ │  │
│  │  │  └─────────┘                                                    │ │  │
│  │  │                                                                 │ │  │
│  │  ├────────────────────────────────────────────────────────────────┤ │  │
│  │  │  Input: [Type your message...] [📤 Send]                       │ │  │
│  │  └────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Components:                                                                │
│  • AgentChat.tsx - Main chat container & state management                  │
│  • ChatMessage.tsx - Individual message rendering                          │
│  • ChatInput.tsx - Message input with keyboard shortcuts                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ HTTP POST/GET
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  /api/agent/chat (route.ts)                                                │
│                                                                              │
│  ┌────────────────────────┐      ┌────────────────────────┐                │
│  │  POST /api/agent/chat  │      │  GET /api/agent/chat   │                │
│  │  ────────────────────  │      │  ───────────────────   │                │
│  │  • Send message        │      │  • Get chat history    │                │
│  │  • Create session      │      │  • Retrieve messages   │                │
│  │  • Get statistics      │      │  • Session details     │                │
│  └────────────────────────┘      └────────────────────────┘                │
│              │                                   │                           │
│              └───────────────┬───────────────────┘                           │
│                              │                                               │
└──────────────────────────────┼───────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AGENT RUNNER                                       │
│                        (lib/agents/runner.ts)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Session Management                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  In-Memory Session Store                                           │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │    │
│  │  │ Session 1    │  │ Session 2    │  │ Session 3    │  ...       │    │
│  │  │ ID: abc123   │  │ ID: def456   │  │ ID: ghi789   │            │    │
│  │  │ Messages: [] │  │ Messages: [] │  │ Messages: [] │            │    │
│  │  │ Agent: Triage│  │ Agent: Triage│  │ Agent: Tech  │            │    │
│  │  │ Created: ... │  │ Created: ... │  │ Created: ... │            │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  Functions:                                                                 │
│  • createSession() - Initialize new conversation                           │
│  • getSession(id) - Retrieve session data                                  │
│  • runAgent(id, input) - Execute agent with user input                     │
│  • addMessage(id, msg) - Add message to history                            │
│  • cleanupSessions() - Remove old sessions                                 │
│                                                                              │
└──────────────────────────────┬───────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MULTI-AGENT SYSTEM                                    │
│                      (lib/agents/config.ts)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                    TRIAGE AGENT (Primary Router)                   │    │
│  │  Model: GPT-4o                                                     │    │
│  │  Role: Route to appropriate specialist based on question type      │    │
│  │  Instructions: Understand user intent and delegate                 │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                         │                                                    │
│          ┌──────────────┼──────────────┬──────────────┐                     │
│          │              │              │              │                     │
│          ▼              ▼              ▼              ▼                     │
│  ┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐          │
│  │   BILLING    │ │ TECHNICAL│ │  GROUP   │ │ GENERAL SUPPORT  │          │
│  │  SPECIALIST  │ │  SUPPORT │ │ MGMT SPEC│ │  (Triage Agent)  │          │
│  ├──────────────┤ ├──────────┤ ├──────────┤ ├──────────────────┤          │
│  │ • Payments   │ │ • Auth   │ │ • Ikimina│ │ • Platform info  │          │
│  │ • Transactions│ │ • MFA    │ │ • Members│ │ • Features       │          │
│  │ • Mobile Money│ │ • Errors │ │ • Groups │ │ • How-to guides  │          │
│  │ • Reconcile  │ │ • Browser│ │ • Cycles │ │ • General help   │          │
│  │ • Fees       │ │ • Offline│ │ • Roles  │ │                  │          │
│  └──────────────┘ └──────────┘ └──────────┘ └──────────────────┘          │
│                                                                              │
│  Agent Features:                                                            │
│  • Automatic handoffs between specialists                                  │
│  • Context preservation across handoffs                                    │
│  • Specialized instructions per agent                                      │
│  • Consistent GPT-4o model for quality                                     │
│                                                                              │
└──────────────────────────────┬───────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AGENT TOOLS                                        │
│                        (lib/agents/tools.ts)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Function Tools (Callable by Agents):                                       │
│                                                                              │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐   │
│  │  search_sacco      │  │  lookup_member     │  │ check_transaction  │   │
│  │  ────────────────  │  │  ───────────────   │  │ ──────────────────  │   │
│  │  Find SACCO info   │  │  Find member data  │  │ Query TX status    │   │
│  │  by name/ID        │  │  by name/ID/phone  │  │ by transaction ID  │   │
│  │                    │  │                    │  │                    │   │
│  │  Input: query      │  │  Input: query      │  │  Input: txId       │   │
│  │  Output: SACCO obj │  │  Output: Member obj│  │  Output: TX obj    │   │
│  └────────────────────┘  └────────────────────┘  └────────────────────┘   │
│                                                                              │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐   │
│  │ get_documentation  │  │   web_search       │  │ get_system_status  │   │
│  │ ───────────────── │  │  ───────────────   │  │ ──────────────────  │   │
│  │  Retrieve help     │  │  Search web        │  │ Check platform     │   │
│  │  docs by topic     │  │  (placeholder)     │  │ health status      │   │
│  │                    │  │                    │  │                    │   │
│  │  Input: topic      │  │  Input: query      │  │  Input: none       │   │
│  │  Output: Doc text  │  │  Output: Results   │  │  Output: Status obj│   │
│  └────────────────────┘  └────────────────────┘  └────────────────────┘   │
│                                                                              │
│  Tool Features:                                                             │
│  • Zod schema validation for inputs                                        │
│  • Structured output with TypeScript types                                 │
│  • Currently return mock data (ready for DB integration)                   │
│  • Easy to extend with new capabilities                                    │
│                                                                              │
└──────────────────────────────┬───────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        OPENAI AGENTS SDK                                     │
│                     (@openai/agents v0.1.11)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Core SDK Features:                                                         │
│  • Multi-agent orchestration                                                │
│  • Automatic tool calling                                                   │
│  • Handoff management                                                       │
│  • Session handling                                                         │
│  • Streaming support (ready for implementation)                            │
│  • Provider-agnostic (can use different LLMs)                              │
│                                                                              │
│  Configuration:                                                             │
│  • Model: GPT-4o (latest and most capable)                                 │
│  • Temperature: 0.7 (balanced creativity)                                  │
│  • Max tokens: 2000 (comprehensive responses)                              │
│  • API Key: From OPENAI_API_KEY env variable                               │
│                                                                              │
└──────────────────────────────┬───────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           OPENAI API                                         │
│                      (api.openai.com/v1)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  • GPT-4o Model API                                                         │
│  • Function calling for tools                                               │
│  • Streaming responses (optional)                                           │
│  • Usage tracking and billing                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


DATA FLOW EXAMPLE:
──────────────────

1. User types: "How do I check a transaction?"
   ↓
2. UI sends POST to /api/agent/chat with sessionId and message
   ↓
3. API route calls runAgent(sessionId, message)
   ↓
4. Runner retrieves session and passes message to Triage Agent
   ↓
5. Triage Agent analyzes question → "This is about transactions"
   ↓
6. Triage Agent hands off to Billing Specialist
   ↓
7. Billing Specialist processes question
   ↓
8. Specialist calls check_transaction tool
   ↓
9. Tool returns mock transaction data
   ↓
10. Specialist formulates response with transaction info
    ↓
11. Response sent back through Runner → API → UI
    ↓
12. User sees: "Here's how to check a transaction... [detailed steps]"


SESSION LIFECYCLE:
──────────────────

[User visits /agent]
         ↓
[UI calls createSession() on mount]
         ↓
[Session created with unique ID, empty messages, Triage Agent]
         ↓
[Welcome message added to session]
         ↓
[User sends messages ←→ Agent responds]
         ↓
[Session persists in memory for 30 minutes of inactivity]
         ↓
[cleanupSessions() removes old sessions periodically]


HANDOFF FLOW:
─────────────

User: "I can't login with my passkey"
  ↓
Triage Agent: "This is a technical/authentication issue"
  ↓
[HANDOFF TO: Technical Support Specialist]
  ↓
Technical Support: "I'll help you with passkey authentication..."
  ↓
[Provides step-by-step troubleshooting]
  ↓
[Agent name shown in UI: "Technical Support"]


FUTURE ENHANCEMENTS:
────────────────────

┌─────────────────────────────────────────────────────────────┐
│ Phase 2: Production Readiness                               │
│ • Redis/PostgreSQL for session persistence                  │
│ • Authentication middleware for API routes                  │
│ • Rate limiting (per user/session)                          │
│ • Usage tracking and cost monitoring                        │
│ • Error tracking (Sentry)                                   │
│ • OpenTelemetry tracing                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Phase 3: Enhanced Capabilities                              │
│ • Web search integration for current info                   │
│ • Database integration for real data (with RLS)             │
│ • Guardrails for safety and PII protection                  │
│ • Conversation quality analytics                            │
│ • User satisfaction tracking                                │
│ • Proactive assistance suggestions                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Phase 4: Advanced Features                                  │
│ • Realtime API with voice input/output                      │
│ • WebRTC for voice streaming                                │
│ • Multi-language support                                    │
│ • Human-in-the-loop escalation                              │
│ • Report generation capabilities                            │
│ • Contextual help in other app pages                        │
└─────────────────────────────────────────────────────────────┘
```
