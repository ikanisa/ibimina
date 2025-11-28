# AI Integration - Environment Setup

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-key-here
NEXT_PUBLIC_OPENAI_API_KEY=sk-proj-your-key-here  # For client-side if needed

# Alternative: Google Gemini
# GEMINI_API_KEY=your-gemini-key-here

# Alternative: Anthropic Claude
# CLAUDE_API_KEY=your-claude-key-here
```

## Getting API Keys

### OpenAI (Recommended)
1. Go to https://platform.openai.com/api-keys
2. Create an account or sign in
3. Click "Create new secret key"
4. Copy the key and add to `.env.local`

### Google Gemini
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Create API key
4. Copy and add to `.env.local`

### Anthropic Claude
1. Go to https://console.anthropic.com/
2. Sign up for account
3. Navigate to API keys
4. Generate key and add to `.env.local`

## Usage in Components

```tsx
import { useLocalAI } from '@ibimina/ui';

function MyComponent() {
  const { generateText, isLoading, error } = useLocalAI();

  const handleChat = async (message: string) => {
    const response = await generateText(message, {
      context: {
        page: 'dashboard',
        userBalance: 150000,
      },
    });
    console.log(response.text);
  };

  return (
    <FloatingAssistant
      onMessage={handleChat}
      isLoading={isLoading}
    />
  );
}
```

## API Rate Limits

### OpenAI GPT-4
- Free tier: 3 requests/minute
- Paid tier: 10,000 requests/minute
- Cost: ~$0.03 per 1K tokens

### Gemini
- Free tier: 60 requests/minute
- Paid tier: Higher limits
- Cost: Free tier available

### Claude
- Variable by tier
- Check Anthropic pricing

## Security Notes

⚠️ **IMPORTANT**:
- Never commit API keys to git
- Use environment variables
- Keep keys in `.env.local` (gitignored)
- Rotate keys if exposed
- Use server-side API routes for production

## Production Setup

For production, use server-side API routes:

```ts
// app/api/ai/chat/route.ts
import { createAIService } from '@ibimina/ui/services/ai';

export async function POST(request: Request) {
  const { message, context } = await request.json();
  
  const ai = createAIService('openai');
  const response = await ai.generateResponse([
    { role: 'user', content: message }
  ], context);

  return Response.json(response);
}
```

Then call from client:

```tsx
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  body: JSON.stringify({ message, context }),
});
```

This keeps API keys secure on the server!
