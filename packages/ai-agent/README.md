# @ibimina/ai-agent

AI-powered customer support agent package for the Ibimina SACCO platform.

## Overview

This package provides the core AI agent functionality for handling customer
support queries. It includes TypeScript interfaces and classes for managing
conversational AI workflows with OpenAI integration.

## Installation

This is a workspace package and is automatically available to other packages in
the monorepo via:

```typescript
import { AIAgent, Message, ChatRequest, ChatResponse } from "@ibimina/ai-agent";
```

## Usage

### Basic Example

```typescript
import { AIAgent } from "@ibimina/ai-agent";

const agent = new AIAgent(process.env.OPENAI_API_KEY);

const response = await agent.chat({
  messages: [
    { role: "system", content: "You are a helpful SACCO support assistant." },
    { role: "user", content: "How do I create a new ikimina group?" },
  ],
});

console.log(response.message);
```

## API Reference

### `AIAgent`

Main class for interacting with the AI agent.

#### Constructor

- `new AIAgent(apiKey: string)` - Creates a new AI agent instance with the
  provided OpenAI API key.

#### Methods

- `chat(request: ChatRequest): Promise<ChatResponse>` - Processes a chat request
  and returns a response.

### Types

#### `Message`

```typescript
interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}
```

#### `ChatRequest`

```typescript
interface ChatRequest {
  messages: Message[];
  model?: string;
  temperature?: number;
}
```

#### `ChatResponse`

```typescript
interface ChatResponse {
  message: string;
  error?: string;
}
```

## Current Status

**Note:** This package currently returns mocked responses. Full OpenAI
integration is planned for a future release.

## Development

### Building

```bash
pnpm --filter @ibimina/ai-agent build
```

### Type Checking

```bash
pnpm --filter @ibimina/ai-agent typecheck
```

## Future Enhancements

- Full OpenAI API integration
- SACCO-specific context and knowledge base
- Conversation history management
- Multi-language support (English, Kinyarwanda, French)
- Integration with Supabase for conversation persistence
- Advanced prompt engineering for SACCO operations
- Function calling for direct system actions
