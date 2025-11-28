# AI Features Implementation Plan

**Project**: Ibimina SACCO+ Platform  
**Target App**: Desktop Staff Admin (`apps/desktop/staff-admin`)  
**Timeline**: 4 weeks  
**Status**: Planning Phase

---

## Overview

Implementation of 5 AI-powered features for the desktop staff admin application:

1. **Document Intelligence** - Gemini Vision for receipt/ID scanning
2. **Fraud Detection Engine** - Hybrid rule-based + AI fraud detection
3. **Voice Command System** - Hands-free navigation and actions
4. **Accessibility System** - WCAG 2.1 AA+ compliance with AI assistance
5. **Real-Time Analytics** - Live dashboards with AI insights

---

## Phase 1: Infrastructure Setup (Week 1)

### 1.1 Environment & Dependencies

**Files to create/modify:**
```
apps/desktop/staff-admin/
├── .env.example                          # Add GEMINI_API_KEY
├── package.json                          # Add new dependencies
└── src/
    └── lib/
        └── config/
            └── ai-config.ts              # AI configuration manager
```

**Dependencies to add:**
```json
{
  "dependencies": {
    "@google/generative-ai": "^0.1.3",
    "framer-motion": "^10.16.16",
    "recharts": "^2.10.3",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/dom-speech-recognition": "^0.0.4"
  }
}
```

**Tasks:**
- [ ] Add dependencies to `apps/desktop/staff-admin/package.json`
- [ ] Update `.env.example` with required keys
- [ ] Create `src/lib/config/ai-config.ts` for centralized config
- [ ] Add Gemini API key to Tauri capabilities

**Tauri Configuration:**
```rust
// src-tauri/capabilities/default.json
{
  "permissions": [
    "core:default",
    "shell:allow-open",
    "dialog:allow-open",
    "fs:allow-read-file",
    "http:allow-fetch"  // For Gemini API
  ]
}
```

### 1.2 Supabase Edge Function (Gemini Proxy)

**File:** `supabase/functions/gemini-proxy/index.ts`

**Purpose:** Secure API key, rate limiting, request validation

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

serve(async (req) => {
  try {
    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Rate limiting check
    const { data: rateLimitData } = await supabase
      .from('api_rate_limits')
      .select('request_count, window_start')
      .eq('user_id', user.id)
      .eq('endpoint', 'gemini-proxy')
      .single();

    if (rateLimitData) {
      const windowStart = new Date(rateLimitData.window_start);
      const now = new Date();
      const hoursDiff = (now.getTime() - windowStart.getTime()) / (1000 * 60 * 60);

      if (hoursDiff < 1 && rateLimitData.request_count >= 100) {
        return new Response('Rate limit exceeded', { status: 429 });
      }
    }

    // Forward request to Gemini
    const body = await req.json();
    
    // Validate and sanitize
    if (!body.contents || !Array.isArray(body.contents)) {
      return new Response('Invalid request', { status: 400 });
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    // Update rate limit
    await supabase.from('api_rate_limits').upsert({
      user_id: user.id,
      endpoint: 'gemini-proxy',
      request_count: (rateLimitData?.request_count || 0) + 1,
      window_start: rateLimitData?.window_start || new Date().toISOString(),
    });

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

**Tasks:**
- [ ] Create `supabase/functions/gemini-proxy/index.ts`
- [ ] Add `GEMINI_API_KEY` to Supabase secrets
- [ ] Create `api_rate_limits` table migration
- [ ] Deploy function: `supabase functions deploy gemini-proxy`
- [ ] Test with Postman/curl

### 1.3 Database Schema

**File:** `supabase/migrations/20241128000000_ai_features_schema.sql`

```sql
-- Rate limiting for Gemini API
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Fraud alerts
CREATE TABLE IF NOT EXISTS fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES allocations(id) ON DELETE SET NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  suggested_action TEXT,
  related_transactions JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'escalated')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member fraud profiles
CREATE TABLE IF NOT EXISTS member_fraud_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES group_members(id) ON DELETE CASCADE,
  typical_amount_min NUMERIC(12,2),
  typical_amount_max NUMERIC(12,2),
  typical_amount_avg NUMERIC(12,2),
  payment_frequency NUMERIC(5,2),
  preferred_payment_days INTEGER[],
  usual_payment_hours JSONB,
  known_phone_numbers TEXT[],
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id)
);

-- Document scans
CREATE TABLE IF NOT EXISTS document_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  document_type TEXT,
  confidence NUMERIC(3,2),
  extracted_data JSONB,
  suggestions TEXT[],
  warnings TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voice commands history
CREATE TABLE IF NOT EXISTS voice_command_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transcript TEXT NOT NULL,
  command_matched TEXT,
  action_taken TEXT,
  confidence NUMERIC(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accessibility settings per user
CREATE TABLE IF NOT EXISTS user_accessibility_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_fraud_alerts_org ON fraud_alerts(organization_id);
CREATE INDEX idx_fraud_alerts_txn ON fraud_alerts(transaction_id);
CREATE INDEX idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX idx_fraud_alerts_severity ON fraud_alerts(severity);
CREATE INDEX idx_member_profiles_member ON member_fraud_profiles(member_id);
CREATE INDEX idx_document_scans_org ON document_scans(organization_id);
CREATE INDEX idx_document_scans_uploader ON document_scans(uploaded_by);
CREATE INDEX idx_voice_history_user ON voice_command_history(user_id);

-- RLS Policies
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_fraud_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_command_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accessibility_settings ENABLE ROW LEVEL SECURITY;

-- Rate limits: users can only see their own
CREATE POLICY "Users view own rate limits"
  ON api_rate_limits FOR SELECT
  USING (auth.uid() = user_id);

-- Fraud alerts: org staff only
CREATE POLICY "Staff view org fraud alerts"
  ON fraud_alerts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM staff_assignments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff insert fraud alerts"
  ON fraud_alerts FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM staff_assignments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff update fraud alerts"
  ON fraud_alerts FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM staff_assignments WHERE user_id = auth.uid()
    )
  );

-- Member profiles: org staff only
CREATE POLICY "Staff view member profiles"
  ON member_fraud_profiles FOR SELECT
  USING (
    member_id IN (
      SELECT gm.id FROM group_members gm
      JOIN groups g ON g.id = gm.group_id
      JOIN staff_assignments sa ON sa.organization_id = g.org_id
      WHERE sa.user_id = auth.uid()
    )
  );

-- Document scans: org staff only
CREATE POLICY "Staff view org documents"
  ON document_scans FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM staff_assignments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff upload documents"
  ON document_scans FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM staff_assignments WHERE user_id = auth.uid()
    )
  );

-- Voice history: users see own
CREATE POLICY "Users view own voice history"
  ON voice_command_history FOR ALL
  USING (auth.uid() = user_id);

-- Accessibility: users see own
CREATE POLICY "Users manage own accessibility"
  ON user_accessibility_settings FOR ALL
  USING (auth.uid() = user_id);
```

**Tasks:**
- [ ] Create migration file
- [ ] Run locally: `supabase db reset`
- [ ] Verify RLS: `pnpm test:rls`
- [ ] Deploy to staging

---

## Phase 2: Core AI Services (Week 2)

### 2.1 Gemini Client Wrapper

**File:** `apps/desktop/staff-admin/src/lib/ai/gemini-client.ts`

```typescript
import { invoke } from '@tauri-apps/api/core';
import { createClient } from '@/lib/supabase/client';

export interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text?: string;
      inline_data?: {
        mime_type: string;
        data: string;
      };
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
  };
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export class GeminiClient {
  private supabase = createClient();

  async generateContent(request: GeminiRequest): Promise<GeminiResponse> {
    try {
      // Call through Supabase Edge Function proxy
      const { data: session } = await this.supabase.auth.getSession();
      
      if (!session?.session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-proxy`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw new Error(`Gemini API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Gemini client error:', error);
      throw error;
    }
  }

  async streamContent(
    request: GeminiRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    // For future streaming implementation
    throw new Error('Streaming not yet implemented');
  }
}

export const gemini = new GeminiClient();
```

**Tasks:**
- [ ] Create `src/lib/ai/gemini-client.ts`
- [ ] Add error handling and retries
- [ ] Create unit tests
- [ ] Add to CI pipeline

### 2.2 Document Intelligence Service

**File:** `apps/desktop/staff-admin/src/lib/ai/document-intelligence.ts`

```typescript
import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';
import { gemini } from './gemini-client';
import { createClient } from '@/lib/supabase/client';

// ... (copy interfaces from original code)

export class DocumentIntelligence {
  private supabase = createClient();

  async analyzeDocument(
    imageData: Uint8Array,
    mimeType: string
  ): Promise<DocumentAnalysisResult> {
    const base64Image = this.arrayBufferToBase64(imageData);

    const response = await gemini.generateContent({
      contents: [{
        parts: [
          {
            text: `Analyze this document image and extract all relevant information. 
            
            Determine the document type from: receipt, id_card, bank_statement, contract, or unknown.
            
            For receipts, extract: merchant name, transaction ID, amount, currency, date, payer phone, payer name, reference. 
            For ID cards (Rwandan National ID), extract: full name, national ID number, date of birth, gender, district, sector, cell. 
            For bank statements, extract: account holder, account number, statement period, transactions list.
            
            Return a JSON object with:
            {
              "type": "document_type",
              "confidence": 0.0-1.0,
              "extractedData": { ... },
              "suggestions": ["suggestion1", "suggestion2"],
              "warnings": ["warning1", "warning2"]
            }
            
            Be thorough and accurate. Flag any suspicious or unclear information in warnings.`
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('No response from Gemini Vision');
    }

    const result = JSON.parse(text) as DocumentAnalysisResult;

    // Store scan in database
    const { data: { user } } = await this.supabase.auth.getUser();
    const { data: orgData } = await this.supabase
      .from('staff_assignments')
      .select('organization_id, country_id')
      .eq('user_id', user?.id)
      .single();

    if (orgData) {
      await this.supabase.from('document_scans').insert({
        organization_id: orgData.organization_id,
        country_id: orgData.country_id,
        uploaded_by: user!.id,
        file_name: 'uploaded-document',
        file_size: imageData.length,
        mime_type: mimeType,
        document_type: result.type,
        confidence: result.confidence,
        extracted_data: result.extractedData,
        suggestions: result.suggestions,
        warnings: result.warnings,
        status: 'processed',
      });
    }

    return result;
  }

  // ... (copy other methods from original code)

  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < buffer.length; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  }

  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'webp': 'image/webp',
      'pdf': 'application/pdf',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}
```

**Tasks:**
- [ ] Create service file
- [ ] Add file size validation (max 5MB)
- [ ] Add progress indicators
- [ ] Create tests with mock images

### 2.3 Fraud Detection Engine

**File:** `apps/desktop/staff-admin/src/lib/ai/fraud-detection.ts`

(Implementation similar to original but with Supabase integration for persistence)

**Key changes:**
- Replace in-memory `Map` with Supabase queries
- Store alerts in `fraud_alerts` table
- Update profiles in `member_fraud_profiles` table
- Add webhook notifications for critical alerts

**Tasks:**
- [ ] Implement service
- [ ] Create background job for profile updates
- [ ] Add email/SMS alerts for critical fraud
- [ ] Write tests with sample transactions

---

## Phase 3: UI Components (Week 3)

### 3.1 Voice Command System

**Files:**
```
src/components/voice/
├── VoiceCommandProvider.tsx
├── VoiceButton.tsx
├── VoiceTranscript.tsx
└── VoiceSettings.tsx
```

**Key Features:**
- Permission request UI
- Visual feedback during listening
- Command palette integration
- Settings panel for wake word customization

**Tasks:**
- [ ] Create provider component
- [ ] Add voice button to main layout
- [ ] Integrate with command palette
- [ ] Add Kinyarwanda language support
- [ ] Battery optimization (pause when inactive)

### 3.2 Accessibility System

**Files:**
```
src/components/accessibility/
├── AccessibilityProvider.tsx
├── AccessibilityMenu.tsx
├── ReadingGuide.tsx
├── FocusIndicator.tsx
└── SkipLink.tsx
```

**CSS Updates:**
```css
/* src/styles/accessibility.css */
.high-contrast {
  --color-text-primary: #000000;
  --color-bg-primary: #ffffff;
  /* ... */
}

.dyslexia-font {
  font-family: 'OpenDyslexic', sans-serif;
}

.cursor-large {
  cursor: url('/cursors/large.svg'), auto;
}

/* ... more styles */
```

**Tasks:**
- [ ] Implement provider
- [ ] Add accessibility menu to settings
- [ ] Test with screen readers (NVDA, VoiceOver)
- [ ] Add keyboard shortcut help overlay
- [ ] Create visual regression tests

### 3.3 Real-Time Analytics Dashboard

**Files:**
```
src/components/analytics/
├── RealTimeAnalytics.tsx
├── LiveStatCard.tsx
├── GeographicView.tsx
├── PerformanceView.tsx
├── FlowView.tsx
└── AIInsights.tsx
```

**Optimizations:**
- Use Supabase real-time subscriptions
- Aggregate data hourly (pg_cron job)
- Debounce AI insights (max 1 per minute)
- Lazy load charts

**Tasks:**
- [ ] Create dashboard layout
- [ ] Implement real-time subscriptions
- [ ] Add export to PDF/Excel
- [ ] Optimize bundle size (code-split charts)
- [ ] Add offline caching

### 3.4 Document Scanner UI

**Files:**
```
src/components/documents/
├── DocumentScanner.tsx
├── ScanHistory.tsx
├── ScanResult.tsx
└── DocumentPreview.tsx
```

**Tasks:**
- [ ] Create upload UI with drag-and-drop
- [ ] Add camera integration (future)
- [ ] Display extraction results
- [ ] Edit/correct extracted data
- [ ] Bulk upload support

---

## Phase 4: Integration & Testing (Week 4)

### 4.1 Tauri Integration

**File:** `apps/desktop/staff-admin/src-tauri/src/commands/ai.rs`

```rust
use tauri::command;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct AccessibilitySettings {
    high_contrast: bool,
    reduced_motion: bool,
    text_scaling: f32,
    // ... other fields
}

#[command]
pub async fn get_accessibility_settings() -> Result<Option<AccessibilitySettings>, String> {
    // Load from app data directory
    let app_data = tauri::api::path::app_data_dir(&tauri::Config::default())
        .ok_or("Failed to get app data dir")?;
    
    let settings_path = app_data.join("accessibility.json");
    
    if !settings_path.exists() {
        return Ok(None);
    }
    
    let contents = std::fs::read_to_string(&settings_path)
        .map_err(|e| e.to_string())?;
    
    let settings: AccessibilitySettings = serde_json::from_str(&contents)
        .map_err(|e| e.to_string())?;
    
    Ok(Some(settings))
}

#[command]
pub async fn save_accessibility_settings(settings: AccessibilitySettings) -> Result<(), String> {
    let app_data = tauri::api::path::app_data_dir(&tauri::Config::default())
        .ok_or("Failed to get app data dir")?;
    
    std::fs::create_dir_all(&app_data)
        .map_err(|e| e.to_string())?;
    
    let settings_path = app_data.join("accessibility.json");
    let contents = serde_json::to_string_pretty(&settings)
        .map_err(|e| e.to_string())?;
    
    std::fs::write(&settings_path, contents)
        .map_err(|e| e.to_string())?;
    
    Ok(())
}
```

**Tasks:**
- [ ] Add Rust commands for file I/O
- [ ] Update `tauri.conf.json` with permissions
- [ ] Test on Windows/macOS/Linux
- [ ] Add auto-updater integration

### 4.2 Testing Strategy

**Unit Tests:**
```bash
# Test AI services
pnpm test src/lib/ai/*.test.ts

# Test components
pnpm test src/components/**/*.test.tsx
```

**Integration Tests:**
```bash
# Test Gemini proxy
curl -X POST http://localhost:54321/functions/v1/gemini-proxy \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{"contents": [{"parts": [{"text": "Test"}]}]}'

# Test fraud detection
pnpm test:integration fraud-detection
```

**E2E Tests:**
```typescript
// tests/e2e/ai-features.spec.ts
test('scan document and extract data', async ({ page }) => {
  await page.goto('/documents/scan');
  await page.setInputFiles('input[type="file"]', 'test-receipt.jpg');
  await expect(page.locator('[data-testid="scan-result"]')).toBeVisible();
  await expect(page.locator('[data-testid="merchant-name"]')).toContainText('MTN Rwanda');
});

test('voice command navigates to dashboard', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="voice-button"]');
  // Simulate voice input (mocked)
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('voice-command', {
      detail: { transcript: 'go to dashboard' }
    }));
  });
  await expect(page).toHaveURL('/dashboard');
});
```

**Accessibility Tests:**
```bash
# Automated a11y testing
pnpm test:a11y

# Manual testing checklist
- [ ] NVDA screen reader (Windows)
- [ ] JAWS screen reader (Windows)
- [ ] VoiceOver (macOS)
- [ ] Keyboard-only navigation
- [ ] High contrast mode
- [ ] 200% zoom level
```

**Tasks:**
- [ ] Write unit tests (80%+ coverage)
- [ ] Write integration tests for all AI features
- [ ] Add E2E tests for critical paths
- [ ] Run accessibility audit with axe-core
- [ ] Load testing (100 concurrent Gemini requests)
- [ ] Security testing (RLS, rate limits)

### 4.3 Documentation

**Files to create:**
```
docs/ai-features/
├── README.md                    # Overview
├── document-intelligence.md     # Document scanning guide
├── fraud-detection.md           # Fraud detection rules
├── voice-commands.md            # Voice command reference
├── accessibility.md             # Accessibility features
└── analytics.md                 # Analytics dashboard guide
```

**Tasks:**
- [ ] Write user documentation
- [ ] Create video tutorials
- [ ] Add in-app help tooltips
- [ ] Document API limits and costs
- [ ] Create troubleshooting guide

---

## Phase 5: Deployment & Monitoring

### 5.1 Feature Flags

**File:** `supabase/migrations/20241128000001_ai_feature_flags.sql`

```sql
INSERT INTO global_feature_flags (key, enabled, config) VALUES
  ('ai_document_scanning', false, '{"max_file_size_mb": 5, "allowed_types": ["image/png", "image/jpeg", "application/pdf"]}'),
  ('ai_fraud_detection', false, '{"auto_block_threshold": 0.9, "alert_channels": ["email", "sms"]}'),
  ('voice_commands', false, '{"wake_word": "ibimina", "languages": ["en-RW", "rw-RW"]}'),
  ('accessibility_enhanced', true, '{}'),
  ('realtime_analytics', false, '{"refresh_interval_ms": 5000, "ai_insights_enabled": false}')
ON CONFLICT (key) DO NOTHING;
```

**Tasks:**
- [ ] Add feature flag checks in UI
- [ ] Create admin panel for flag management
- [ ] Implement gradual rollout strategy
- [ ] Add analytics for feature usage

### 5.2 Monitoring & Alerting

**Metrics to track:**
- Gemini API usage (requests/day, tokens/request)
- Document scan success rate
- Fraud alert accuracy (false positives)
- Voice command recognition accuracy
- Accessibility feature adoption
- Dashboard load times

**Sentry Integration:**
```typescript
// src/lib/monitoring/sentry.ts
import * as Sentry from '@sentry/tauri';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  beforeSend(event) {
    // Remove PII
    if (event.request?.data) {
      event.request.data = '[Redacted]';
    }
    return event;
  },
});

export function captureAIError(error: Error, context: Record<string, any>) {
  Sentry.captureException(error, {
    tags: { component: 'ai-features' },
    contexts: { ai: context },
  });
}
```

**Tasks:**
- [ ] Set up Sentry error tracking
- [ ] Configure PostHog for product analytics
- [ ] Create Grafana dashboards
- [ ] Set up PagerDuty alerts for critical issues
- [ ] Weekly usage reports

### 5.3 Cost Management

**Gemini API Cost Estimation:**
- Document scanning: ~$0.001 per scan (avg 1 image)
- Fraud detection: ~$0.0005 per analysis (text only)
- Analytics insights: ~$0.0003 per generation
- **Estimated monthly cost (1000 users):** $150-300

**Optimization strategies:**
- Cache common queries
- Batch document processing
- Rate limit per user (100 requests/hour)
- Use smaller Gemini models for simple tasks
- Implement request deduplication

**Tasks:**
- [ ] Set up billing alerts in Google Cloud
- [ ] Implement cost tracking dashboard
- [ ] Add usage quotas per organization
- [ ] Create cost reports for stakeholders

---

## Rollout Plan

### Phase 1: Internal Testing (Week 5)
- Deploy to staging environment
- Test with 5-10 internal users
- Collect feedback and fix critical bugs
- Feature flags: ALL disabled except `accessibility_enhanced`

### Phase 2: Pilot (Week 6-7)
- Enable for Nyamagabe SACCO (pilot org)
- 20-30 staff users
- Feature flags: Enable one feature per week
  - Week 6: `ai_document_scanning`
  - Week 7: `ai_fraud_detection`, `voice_commands`

### Phase 3: Limited Rollout (Week 8-9)
- Expand to 3-5 SACCOs
- 100+ users
- Feature flags: Enable `realtime_analytics`
- Monitor performance and costs

### Phase 4: Full Rollout (Week 10+)
- Enable for all organizations
- Feature flags: All enabled by default
- Announce in product changelog
- Conduct training webinars

---

## Success Metrics

**Week 1-4 (Development):**
- [ ] All 5 features implemented
- [ ] 80%+ test coverage
- [ ] Zero P0 security issues
- [ ] Documentation complete

**Week 5-7 (Pilot):**
- [ ] 70%+ user adoption (at least 1 feature used)
- [ ] <5% error rate
- [ ] <2s avg response time for AI features
- [ ] 90%+ positive feedback

**Week 8-12 (Rollout):**
- [ ] 50%+ daily active usage
- [ ] <$500/month Gemini API costs
- [ ] <10 fraud false positives/week
- [ ] 95%+ uptime

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Gemini API quota exceeded | Medium | High | Rate limiting, caching, fallback to rules |
| High false positive fraud rate | Medium | Medium | Continuous ML tuning, human review loop |
| Voice recognition poor accuracy | High | Low | Fallback to keyboard, multiple languages |
| Accessibility features not used | Medium | Low | User training, in-app tutorials |
| Security breach (API key leak) | Low | Critical | Edge function proxy, secret rotation |
| Cost overruns | Medium | Medium | Usage quotas, billing alerts |

---

## Team & Responsibilities

**Backend Engineer:**
- Supabase Edge Functions
- Database migrations
- RLS policies
- Background jobs

**Frontend Engineer:**
- React components
- Tauri integration
- State management
- UI/UX implementation

**ML/AI Engineer:**
- Prompt engineering
- Fraud detection rules
- Model evaluation
- Performance tuning

**QA Engineer:**
- Test strategy
- Automated testing
- Accessibility testing
- Security testing

**DevOps:**
- CI/CD pipeline
- Monitoring setup
- Cost tracking
- Deployment automation

---

## Next Steps

1. **Immediate (Today):**
   - [ ] Review and approve this plan
   - [ ] Assign team members
   - [ ] Set up project board
   - [ ] Get Gemini API key

2. **Week 1 Kickoff:**
   - [ ] Team standup meeting
   - [ ] Environment setup (all devs)
   - [ ] Create feature branch: `feature/ai-features`
   - [ ] First commit: dependencies and config

3. **Daily Standups:**
   - What did I complete yesterday?
   - What am I working on today?
   - Any blockers?

4. **Weekly Demos:**
   - Friday 3pm: Show progress to stakeholders
   - Collect feedback
   - Adjust plan as needed

---

## Appendix

### A. Environment Variables

```bash
# .env.example additions
VITE_GEMINI_API_KEY=your_key_here  # Only for local dev
VITE_FEATURE_AI_DOCUMENT_SCANNING=false
VITE_FEATURE_AI_FRAUD_DETECTION=false
VITE_FEATURE_VOICE_COMMANDS=false
VITE_FEATURE_REALTIME_ANALYTICS=false
VITE_SENTRY_DSN=https://...
VITE_POSTHOG_KEY=phc_...
```

### B. Useful Commands

```bash
# Development
pnpm dev                           # Start dev server
pnpm test                          # Run all tests
pnpm test:watch                    # Watch mode
pnpm lint                          # Lint code
pnpm typecheck                     # Type check

# Supabase
supabase start                     # Start local
supabase db reset                  # Reset DB
supabase functions serve gemini-proxy  # Test function locally
supabase functions deploy gemini-proxy  # Deploy function

# Tauri
pnpm tauri dev                     # Start Tauri app
pnpm tauri build                   # Build release
pnpm tauri build --debug           # Build debug

# Testing
pnpm test:unit                     # Unit tests only
pnpm test:integration              # Integration tests
pnpm test:e2e                      # E2E tests
pnpm test:a11y                     # Accessibility tests
```

### C. References

- [Gemini API Docs](https://ai.google.dev/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Tauri Guides](https://tauri.app/v1/guides/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Recharts Documentation](https://recharts.org/en-US/)

---

**Document Version:** 1.0  
**Last Updated:** 2024-11-28  
**Owner:** Ibimina Development Team  
**Status:** ✅ Ready for Implementation
