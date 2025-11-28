# AI Features Quick Start Guide

**Branch:** `feature/ai-features`  
**Status:** Phase 1 Complete ✅ | Phase 2 Ready

---

## 🚀 Quick Commands

### Development
```bash
# Switch to feature branch
git checkout feature/ai-features

# Install dependencies (if not done)
pnpm install

# Start development server
pnpm --filter @ibimina/staff-admin-desktop dev

# Type check
pnpm --filter @ibimina/staff-admin-desktop typecheck
```

### Supabase Setup
```bash
# Start local Supabase
supabase start

# Run migrations
supabase db push

# Deploy Edge Function
supabase functions deploy gemini-proxy

# Add Gemini API key
supabase secrets set GEMINI_API_KEY=your_key_here

# Test Edge Function
supabase functions serve gemini-proxy
```

### Testing
```bash
# Test Gemini proxy (requires auth token)
curl -X POST http://localhost:54321/functions/v1/gemini-proxy \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{"text": "Say hello"}]
    }],
    "generationConfig": {
      "temperature": 0.1,
      "responseMimeType": "application/json"
    }
  }'
```

---

## 📁 Project Structure

```
apps/desktop/staff-admin/src/
├── lib/
│   ├── ai/
│   │   ├── gemini-client.ts          # Gemini API wrapper
│   │   ├── document-intelligence.ts  # 🚧 Phase 2
│   │   ├── fraud-detection.ts        # 🚧 Phase 2
│   │   └── voice-commands.ts         # 🚧 Phase 2
│   └── config/
│       └── ai-config.ts              # Configuration & feature flags
└── components/
    ├── voice/                         # 🚧 Phase 3
    ├── accessibility/                 # 🚧 Phase 3
    ├── analytics/                     # 🚧 Phase 3
    └── documents/                     # 🚧 Phase 3

supabase/
├── functions/
│   └── gemini-proxy/                 # ✅ Complete
└── migrations/
    └── 20260120000000_ai_*.sql       # ✅ Complete
```

---

## 🎯 Feature Flags

Enable features via environment variables:

```bash
# .env.local
VITE_FEATURE_DOCUMENT_SCANNING=false
VITE_FEATURE_FRAUD_DETECTION=false
VITE_FEATURE_VOICE_COMMANDS=false
VITE_FEATURE_ACCESSIBILITY_ENHANCED=true
VITE_FEATURE_REALTIME_ANALYTICS=false
```

Check in code:
```typescript
import { isFeatureEnabled } from '@/lib/config/ai-config';

if (isFeatureEnabled('documentScanning')) {
  // Enable document scanning UI
}
```

---

## 💾 Database Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `api_rate_limits` | Track API usage per user | ✅ User-scoped |
| `fraud_alerts` | Fraud detection alerts | ✅ Org-scoped |
| `member_fraud_profiles` | Behavioral profiles | ✅ Org-scoped |
| `document_scans` | Document scan history | ✅ Org-scoped |
| `voice_command_history` | Voice usage logs | ✅ User-scoped |
| `user_accessibility_settings` | A11y preferences | ✅ User-scoped |

---

## 🔒 Security

- ✅ API keys stored in Supabase secrets (never in client)
- ✅ All requests authenticated via Supabase auth
- ✅ Rate limiting: 100 requests/hour per user
- ✅ RLS policies enforce organization isolation
- ✅ Request validation (max 10MB payload)
- ✅ CORS properly configured

---

## 📊 Usage Example

```typescript
import { gemini } from '@/lib/ai/gemini-client';

async function analyzeDocument(imageBase64: string) {
  try {
    const response = await gemini.generateContent({
      contents: [{
        parts: [
          {
            text: 'Analyze this receipt and extract transaction details as JSON.'
          },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: imageBase64
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    });

    const result = JSON.parse(response.candidates[0].content.parts[0].text);
    return result;

  } catch (error) {
    if (error instanceof GeminiError && error.status === 429) {
      console.error('Rate limit exceeded. Retry after:', error.retryAfter);
    }
    throw error;
  }
}
```

---

## 🐛 Troubleshooting

### "GEMINI_API_KEY not configured"
```bash
# Add to Supabase secrets
supabase secrets set GEMINI_API_KEY=your_key_here

# Restart Edge Function
supabase functions deploy gemini-proxy --no-verify-jwt
```

### "Rate limit exceeded"
- Check usage: `gemini.getUsageStats()`
- Wait for reset (shown in error)
- Contact admin to increase limit

### "Not authenticated"
- Ensure user is logged in
- Check Supabase session: `supabase.auth.getSession()`
- Verify JWT token is valid

### TypeScript errors
```bash
# Regenerate types from Supabase
supabase gen types typescript --local > src/types/supabase.ts

# Typecheck
pnpm typecheck
```

---

## 📈 Monitoring

### Client-side
```typescript
// Get usage stats
const stats = gemini.getUsageStats();
console.log(`Requests: ${stats.requestCount}, Reset in: ${stats.resetIn}s`);
```

### Database Queries
```sql
-- Check rate limits
SELECT user_id, request_count, window_start 
FROM api_rate_limits 
WHERE endpoint = 'gemini-proxy';

-- Recent fraud alerts
SELECT * FROM fraud_alerts 
WHERE status = 'pending' 
ORDER BY created_at DESC 
LIMIT 10;

-- Document scan success rate
SELECT 
  document_type,
  COUNT(*) as total,
  AVG(confidence) as avg_confidence,
  AVG(processing_time_ms) as avg_time_ms
FROM document_scans
WHERE status = 'processed'
GROUP BY document_type;
```

---

## 🎨 Next Steps

1. **Phase 2** - Implement core AI services:
   - Document Intelligence
   - Fraud Detection Engine
   - Voice Command System

2. **Phase 3** - Build UI components:
   - Voice button and transcript UI
   - Accessibility menu
   - Real-time analytics dashboard
   - Document scanner interface

3. **Phase 4** - Testing & deployment:
   - Unit tests
   - Integration tests
   - E2E tests
   - Staging deployment

---

## 📚 References

- [AI Features Implementation Plan](./AI_FEATURES_IMPLEMENTATION_PLAN.md)
- [Phase 1 Completion Summary](./AI_PHASE_1_COMPLETE.md)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Last Updated:** 2024-11-28  
**Maintainer:** Ibimina Development Team
