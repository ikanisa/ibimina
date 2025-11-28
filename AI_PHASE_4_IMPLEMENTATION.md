# AI Phase 4: Integration & Testing - IMPLEMENTATION GUIDE

**Date:** 2024-11-28  
**Branch:** `feature/ai-features`  
**Status:** 🚀 IN PROGRESS

---

## Overview

Phase 4 integrates all AI features into the desktop app, adds comprehensive testing, and prepares for production deployment.

**Duration:** ~8 hours  
**Components:** 12 integration tasks + testing suite

---

## Part 1: Desktop App Integration (4 hours)

### 1.1 Main App Layout Integration

**File:** `apps/desktop/staff-admin/src/App.tsx`

**Tasks:**
- [ ] Add VoiceCommandProvider to root
- [ ] Add AccessibilityProvider to root  
- [ ] Add CommandPalette with keyboard shortcuts
- [ ] Add floating VoiceButton
- [ ] Add global AI insights
- [ ] Configure routing for AI features

### 1.2 Navigation Integration

**File:** `apps/desktop/staff-admin/src/components/layout/Sidebar.tsx`

**New Menu Items:**
- Documents → `/documents` (with scanner icon)
- Security → `/security` (fraud alerts)
- Analytics → `/analytics` (real-time dashboards)
- Settings → `/settings` (with a11y submenu)

### 1.3 Dashboard Integration

**File:** `apps/desktop/staff-admin/src/pages/Dashboard.tsx`

**Widgets to add:**
- Recent fraud alerts (FraudStats)
- Today's document scans count
- AI insights for today's activity
- Quick action cards for voice commands

### 1.4 Feature Pages

**Create 4 new pages:**

1. **`/documents` - Document Management**
   - DocumentScanner component
   - Recent scans table
   - BatchUploader for bulk processing
   - Scan history with search/filter

2. **`/security` - Fraud Monitoring**
   - FraudAlertList with real-time updates
   - FraudStats dashboard
   - Member fraud profiles table
   - AI insights for anomalies

3. **`/analytics` - Real-Time Analytics**
   - LiveFeed component
   - AnalyticsCharts (area, bar, pie)
   - Time range selector
   - Export functionality

4. **`/settings` - Settings**
   - AccessibilityMenu tab
   - VoiceSettings tab
   - AI preferences (rate limits, quotas)
   - Notification settings

---

## Part 2: Tauri Commands (2 hours)

### 2.1 Rust Commands

**File:** `apps/desktop/staff-admin/src-tauri/src/commands/ai.rs`

**Commands to implement:**

```rust
#[command]
pub async fn get_accessibility_settings() -> Result<Option<AccessibilitySettings>, String>

#[command]
pub async fn save_accessibility_settings(settings: AccessibilitySettings) -> Result<(), String>

#[command]
pub async fn get_voice_command_history(limit: u32) -> Result<Vec<VoiceCommand>, String>

#[command]
pub async fn save_voice_command(command: VoiceCommand) -> Result<(), String>

#[command]
pub async fn get_document_scan_cache(scan_id: String) -> Result<Option<CachedScan>, String>

#[command]
pub async fn clear_document_cache() -> Result<(), String>
```

### 2.2 TypeScript Bindings

**File:** `apps/desktop/staff-admin/src/lib/tauri/commands.ts`

```typescript
import { invoke } from '@tauri-apps/api/core';

export const tauriCommands = {
  accessibility: {
    getSettings: () => invoke<AccessibilitySettings | null>('get_accessibility_settings'),
    saveSettings: (settings: AccessibilitySettings) => 
      invoke('save_accessibility_settings', { settings }),
  },
  voice: {
    getHistory: (limit: number) => 
      invoke<VoiceCommand[]>('get_voice_command_history', { limit }),
    saveCommand: (command: VoiceCommand) => 
      invoke('save_voice_command', { command }),
  },
  documents: {
    getCache: (scanId: string) => 
      invoke<CachedScan | null>('get_document_scan_cache', { scanId }),
    clearCache: () => invoke('clear_document_cache'),
  },
};
```

### 2.3 Permissions Configuration

**File:** `apps/desktop/staff-admin/src-tauri/tauri.conf.json`

**Update permissions:**
```json
{
  "tauri": {
    "allowlist": {
      "fs": {
        "all": false,
        "readFile": true,
        "writeFile": true,
        "scope": ["$APPDATA/*"]
      },
      "dialog": {
        "all": false,
        "open": true
      },
      "http": {
        "all": false,
        "request": true,
        "scope": ["https://*.supabase.co/*", "https://generativelanguage.googleapis.com/*"]
      },
      "shell": {
        "all": false,
        "open": true
      }
    }
  }
}
```

---

## Part 3: State Management (1 hour)

### 3.1 AI State Context

**File:** `apps/desktop/staff-admin/src/contexts/AIContext.tsx`

```typescript
interface AIState {
  documentsEnabled: boolean;
  fraudDetectionEnabled: boolean;
  voiceCommandsEnabled: boolean;
  analyticsEnabled: boolean;
  geminiQuota: {
    used: number;
    limit: number;
    resetAt: Date;
  };
}

const AIContext = createContext<{
  state: AIState;
  refreshQuota: () => Promise<void>;
  enableFeature: (feature: keyof AIState) => void;
  disableFeature: (feature: keyof AIState) => void;
} | null>(null);
```

### 3.2 Real-time Subscriptions

**File:** `apps/desktop/staff-admin/src/hooks/useRealtimeAI.ts`

```typescript
export function useRealtimeFraudAlerts() {
  const { data, error } = useRealtimeSubscription({
    table: 'fraud_alerts',
    filter: 'status=eq.pending',
    onUpdate: (payload) => {
      // Show toast notification for critical alerts
      if (payload.new.severity === 'critical') {
        toast.error(`Critical fraud alert: ${payload.new.description}`);
      }
    },
  });

  return { alerts: data, error };
}

export function useRealtimeDocumentScans() {
  // Similar pattern for document_scans table
}
```

---

## Part 4: Testing Suite (3 hours)

### 4.1 Unit Tests

**Document Intelligence Tests:**
```bash
apps/desktop/staff-admin/tests/unit/ai/
├── document-intelligence.test.ts
├── fraud-detection.test.ts
├── voice-commands.test.ts
└── gemini-client.test.ts
```

**Example Test:**
```typescript
describe('DocumentIntelligence', () => {
  it('should analyze MoMo receipt correctly', async () => {
    const mockImage = createMockReceiptImage();
    const result = await documentIntelligence.scanMoMoReceipt(mockImage);
    
    expect(result.transactionId).toMatch(/^[A-Z]{2}\d{10}$/);
    expect(result.amount).toBeGreaterThan(0);
    expect(result.currency).toBe('RWF');
    expect(result.payerPhone).toMatch(/^\+250\d{9}$/);
  });

  it('should handle batch uploads with concurrency limit', async () => {
    const files = Array(10).fill(null).map(() => createMockFile());
    const results = await documentIntelligence.batchAnalyze(files);
    
    expect(results.size).toBe(10);
    expect(concurrencyLimit).toBeLessThanOrEqual(3);
  });
});
```

### 4.2 Integration Tests

**Fraud Detection Integration:**
```typescript
describe('Fraud Detection Integration', () => {
  it('should detect duplicate payments', async () => {
    const transaction1 = createMockTransaction({ amount: 10000 });
    const transaction2 = { ...transaction1, id: 'different-id' };
    
    await fraudDetection.analyzeTransaction(transaction1);
    const alerts = await fraudDetection.analyzeTransaction(transaction2);
    
    expect(alerts).toContainEqual(
      expect.objectContaining({ type: 'duplicate_payment', severity: 'high' })
    );
  });

  it('should create member behavioral profile', async () => {
    const transactions = Array(20).fill(null).map(() => createMockTransaction());
    
    fraudDetection.updateMemberProfile('member-123', transactions);
    const profile = await supabase
      .from('member_fraud_profiles')
      .select('*')
      .eq('member_id', 'member-123')
      .single();
    
    expect(profile.data).toBeDefined();
    expect(profile.data.typical_amount_avg).toBeCloseTo(expectedAvg, 2);
  });
});
```

### 4.3 E2E Tests (Playwright)

**File:** `apps/desktop/staff-admin/tests/e2e/ai-features.spec.ts`

```typescript
test.describe('AI Features', () => {
  test('should scan document and populate form', async ({ page }) => {
    await page.goto('/documents');
    
    // Upload test receipt
    await page.setInputFiles('input[type="file"]', 'tests/fixtures/receipt.jpg');
    
    // Wait for scanning
    await expect(page.locator('[data-testid="scan-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="scan-result"]')).toBeVisible({ timeout: 10000 });
    
    // Verify extracted data
    const amount = await page.locator('[data-testid="extracted-amount"]').textContent();
    expect(amount).toContain('RWF');
  });

  test('should show fraud alert notification', async ({ page, context }) => {
    await page.goto('/dashboard');
    
    // Simulate fraud alert via Supabase realtime (mock)
    await context.addInitScript(() => {
      window.__supabase_realtime_mock = {
        channel: () => ({
          on: (event: string, callback: Function) => {
            if (event === 'INSERT') {
              setTimeout(() => callback({
                new: {
                  severity: 'critical',
                  type: 'duplicate_payment',
                  description: 'Test fraud alert',
                },
              }), 1000);
            }
          },
          subscribe: () => {},
        }),
      };
    });
    
    await expect(page.locator('.toast')).toContainText('Critical fraud alert');
  });

  test('should execute voice command', async ({ page }) => {
    await page.goto('/');
    
    // Mock Web Speech API
    await page.addInitScript(() => {
      (window as any).SpeechRecognition = class MockSpeechRecognition {
        start() {
          setTimeout(() => {
            this.onresult?.({
              results: [[{ transcript: 'go to dashboard', confidence: 0.95 }]],
              resultIndex: 0,
            });
          }, 500);
        }
        stop() {}
      };
    });
    
    await page.click('[data-testid="voice-button"]');
    await page.waitForURL('/dashboard');
  });

  test('should apply accessibility settings', async ({ page }) => {
    await page.goto('/settings');
    
    // Enable high contrast
    await page.click('[data-testid="high-contrast-toggle"]');
    
    // Verify body class
    await expect(page.locator('body')).toHaveClass(/high-contrast/);
    
    // Increase text size
    await page.fill('[data-testid="text-scale-slider"]', '1.5');
    
    const fontSize = await page.locator('html').evaluate(el => 
      getComputedStyle(el).fontSize
    );
    expect(parseFloat(fontSize)).toBeCloseTo(24, 0); // 16 * 1.5
  });
});
```

### 4.4 Accessibility Tests

**File:** `apps/desktop/staff-admin/tests/a11y/ai-components.test.ts`

```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await injectAxe(page);
  });

  test('DocumentScanner should be accessible', async ({ page }) => {
    await page.goto('/documents');
    await checkA11y(page, '[data-testid="document-scanner"]');
  });

  test('FraudAlertList should be keyboard navigable', async ({ page }) => {
    await page.goto('/security');
    
    // Tab to first alert
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focused).toBe('alert-card-0');
    
    // Arrow down to next
    await page.keyboard.press('ArrowDown');
    const newFocused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(newFocused).toBe('alert-card-1');
  });

  test('VoiceButton should announce status changes', async ({ page }) => {
    await page.goto('/');
    
    const announcements: string[] = [];
    await page.exposeFunction('captureAnnouncement', (text: string) => {
      announcements.push(text);
    });
    
    await page.addInitScript(() => {
      const announcer = document.querySelector('[aria-live]');
      const observer = new MutationObserver(() => {
        (window as any).captureAnnouncement(announcer?.textContent || '');
      });
      observer.observe(announcer!, { childList: true, characterData: true });
    });
    
    await page.click('[data-testid="voice-button"]');
    await page.waitForTimeout(1000);
    
    expect(announcements).toContain('Voice commands activated');
  });
});
```

### 4.5 Performance Tests

**File:** `apps/desktop/staff-admin/tests/performance/ai-benchmarks.test.ts`

```typescript
test.describe('Performance', () => {
  test('should scan document in under 3 seconds', async ({ page }) => {
    const start = Date.now();
    
    await page.goto('/documents');
    await page.setInputFiles('input[type="file"]', 'tests/fixtures/receipt.jpg');
    await expect(page.locator('[data-testid="scan-result"]')).toBeVisible();
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(3000);
  });

  test('should detect fraud in under 2 seconds', async () => {
    const transaction = createMockTransaction();
    const start = Date.now();
    
    const alerts = await fraudDetection.analyzeTransaction(transaction);
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(2000);
  });

  test('should handle 100 concurrent fraud checks', async () => {
    const transactions = Array(100).fill(null).map(() => createMockTransaction());
    
    const start = Date.now();
    await Promise.all(transactions.map(t => fraudDetection.analyzeTransaction(t)));
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(10000); // 10s for 100 transactions
  });
});
```

---

## Part 5: Documentation & Deployment (2 hours)

### 5.1 User Documentation

**Create:**
- Feature introduction video (2 min)
- Quick start guide with screenshots
- Voice command cheat sheet
- Accessibility keyboard shortcuts reference
- Troubleshooting FAQ

### 5.2 Developer Documentation

**Update:**
- API reference with all service methods
- Component props documentation
- Tauri command reference
- Database schema diagrams
- RLS policy explanations

### 5.3 Deployment Checklist

**Pre-deployment:**
- [ ] All tests passing (unit, integration, E2E, a11y)
- [ ] No console errors or warnings
- [ ] Lighthouse score 90+ (all categories)
- [ ] Bundle size under 600KB gzipped
- [ ] API rate limits configured
- [ ] Feature flags ready
- [ ] Monitoring dashboards created
- [ ] Rollback plan documented

**Deployment Steps:**
1. Merge feature branch to `work`
2. Deploy database migrations
3. Deploy Gemini proxy function
4. Set Supabase secrets
5. Build and test desktop app
6. Deploy to staging
7. Run smoke tests
8. Deploy to production
9. Monitor for 24 hours

---

## Testing Command Reference

```bash
# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Accessibility tests
pnpm test:a11y

# Performance tests
pnpm test:perf

# All tests
pnpm test:all

# Coverage report
pnpm test:coverage

# Watch mode
pnpm test:watch
```

---

## Success Criteria

**Phase 4 Complete When:**
- [ ] All 4 feature pages working
- [ ] Tauri commands implemented and tested
- [ ] 80%+ test coverage achieved
- [ ] Zero accessibility violations
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Ready for production deployment

---

## Time Estimate

- **Part 1:** Integration (4 hours)
- **Part 2:** Tauri commands (2 hours)
- **Part 3:** State management (1 hour)
- **Part 4:** Testing (3 hours)
- **Part 5:** Documentation (2 hours)

**Total:** ~12 hours

---

**Next:** Create integration components and feature pages
