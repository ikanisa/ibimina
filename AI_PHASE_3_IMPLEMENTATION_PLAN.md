# Phase 3 Implementation Plan: UI Components

**Status:** Document Scanner Complete ✅  
**Remaining:** 4 component groups

---

## Completed Components

### ✅ Document Scanner (`DocumentScanner.tsx`)
- **Lines:** 350+
- **Features:**
  - Drag-and-drop upload
  - File dialog integration
  - Real-time progress indicator
  - Results display with confidence meter
  - Extracted data formatting
  - Warnings and suggestions
  - Dark mode support
  - Revolut-grade UI (glass cards, shadows, smooth animations)

---

## Remaining Components (Implementation Guide)

### 1. Fraud Alert Dashboard

**Components to create:**

#### `FraudAlertList.tsx` (~300 lines)
```typescript
// Features:
- Real-time alert feed with Supabase realtime
- Severity-based filtering (critical, high, medium, low)
- Search and sort functionality
- Alert cards with color-coded severity
- Batch actions (mark as reviewed, dismiss)
- Pagination
- Empty state design

// UI Structure:
<div className="space-y-4">
  <AlertFilters />
  <AlertGrid>
    {alerts.map(alert => <AlertCard alert={alert} />)}
  </AlertGrid>
  <Pagination />
</div>
```

#### `AlertCard.tsx` (~150 lines)
```typescript
// Features:
- Severity indicator (red/orange/yellow/green dot)
- Transaction details
- Confidence meter
- Related transactions count
- Quick actions (review, dismiss, escalate)
- Expand/collapse animation

// Design:
- Glass card with shadow
- Hover scale effect
- Color-coded left border
- Mono font for IDs
```

#### `AlertDetail.tsx` (~250 lines)
```typescript
// Features:
- Full alert information modal
- Transaction timeline
- Member behavioral profile
- AI analysis explanation
- Review form with notes
- Related alerts
- Actions history

// UI:
- Full-screen modal or side panel
- Tabs for different sections
- Timeline visualization
- Profile charts
```

#### `FraudStats.tsx` (~200 lines)
```typescript
// Features:
- Alert statistics cards
- Severity distribution chart
- Trends over time
- Detection accuracy metrics
- Top fraud types

// Charts:
- Recharts integration
- Animated counters
- Sparklines
```

### 2. Voice Command UI

#### `VoiceButton.tsx` (~150 lines)
```typescript
// Features:
- Floating action button
- Pulse animation when listening
- Mic icon with sound waves
- Tooltip showing status
- Haptic feedback

// States:
- Idle (gray)
- Listening (blue pulse)
- Processing (spinner)
- Success (green check)
- Error (red X)

// Design:
<button className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full shadow-xl">
  <Mic className={isListening ? 'animate-pulse' : ''} />
</button>
```

#### `VoiceTranscript.tsx` (~100 lines)
```typescript
// Features:
- Live transcript display
- Interim results (gray)
- Final results (black)
- Auto-scroll
- Fade-out animation

// Design:
- Floating panel above voice button
- Glass background
- Mono font for text
- Smooth slide-up animation
```

#### `CommandPalette.tsx` (~250 lines)
```typescript
// Features:
- Command list by category
- Search/filter
- Keyboard shortcuts
- Command patterns
- Enable/disable toggles

// UI:
- Modal overlay
- Categorized sections
- Command chips
- Fuzzy search
```

#### `VoiceSettings.tsx` (~150 lines)
```typescript
// Settings:
- Wake word customization
- Language selection
- Confidence threshold slider
- Continuous listening toggle
- Voice feedback toggle
- Microphone selection

// Design:
- Settings panel
- Toggle switches
- Sliders with labels
- Dropdown selects
```

### 3. Accessibility Menu

#### `AccessibilityMenu.tsx` (~300 lines)
```typescript
// Features:
- Text scaling (0.5x - 2x)
- High contrast toggle
- Color blind modes (3 types)
- Reduced motion toggle
- Dyslexia font
- Reading guide
- Focus indicators
- Keyboard shortcuts list

// UI:
- Slide-out panel from right
- Grouped settings
- Live preview
- Quick presets (Low Vision, Motor, Cognitive)

// Design:
<aside className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl">
  <SettingsGroup title="Vision">
    <TextScaleSlider />
    <ContrastToggle />
    <ColorBlindSelect />
  </SettingsGroup>
  <SettingsGroup title="Motor">
    <StickyKeysToggle />
    <SlowKeysToggle />
  </SettingsGroup>
</aside>
```

#### `AccessibilitySettings.tsx` (~200 lines)
```typescript
// Persisted settings with Supabase
- Load on mount
- Save on change
- Sync across devices
- Apply to document root

// Integration:
const { settings, updateSettings } = useAccessibility();
```

### 4. Real-Time Analytics

#### `LiveFeed.tsx` (~200 lines)
```typescript
// Features:
- Real-time payment stream (Supabase realtime)
- Animated entry/exit
- Status indicators
- Auto-scroll
- Filters by group/member

// Design:
<div className="space-y-2 max-h-96 overflow-auto">
  <AnimatePresence>
    {payments.map(p => (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
      >
        <PaymentCard payment={p} />
      </motion.div>
    ))}
  </AnimatePresence>
</div>
```

#### `AnalyticsCharts.tsx` (~350 lines)
```typescript
// Charts (Recharts):
1. Hourly Trend (Area chart)
2. Group Distribution (Pie chart)
3. Member Activity (Bar chart)
4. Geographic Map (Treemap)

// Features:
- Interactive tooltips
- Responsive sizing
- Dark mode support
- Export to image
- Date range picker

// Example:
<ResponsiveContainer width="100%" height={300}>
  <AreaChart data={hourlyData}>
    <defs>
      <linearGradient id="gradient">
        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
      </linearGradient>
    </defs>
    <Area dataKey="amount" fill="url(#gradient)" />
  </AreaChart>
</ResponsiveContainer>
```

#### `AIInsights.tsx` (~250 lines)
```typescript
// Features:
- AI-generated insights (from Gemini)
- Streaming responses
- Insight cards with actions
- Refresh button
- Loading skeleton

// Design:
<div className="space-y-4">
  {insights.map(insight => (
    <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
      <h4 className="font-semibold">{insight.title}</h4>
      <p className="text-sm">{insight.description}</p>
      <button className="mt-2 text-sm text-blue-600">
        {insight.action} →
      </button>
    </div>
  ))}
</div>
```

---

## Complete File Structure

```
apps/desktop/staff-admin/src/components/
├── documents/
│   ├── DocumentScanner.tsx          ✅ (350 lines)
│   ├── ScanProgress.tsx             📝 (100 lines)
│   ├── ScanResults.tsx              📝 (200 lines)
│   └── BatchUploader.tsx            📝 (250 lines)
├── fraud/
│   ├── FraudAlertList.tsx           📝 (300 lines)
│   ├── AlertCard.tsx                📝 (150 lines)
│   ├── AlertDetail.tsx              📝 (250 lines)
│   └── FraudStats.tsx               📝 (200 lines)
├── voice/
│   ├── VoiceButton.tsx              📝 (150 lines)
│   ├── VoiceTranscript.tsx          📝 (100 lines)
│   ├── CommandPalette.tsx           📝 (250 lines)
│   └── VoiceSettings.tsx            📝 (150 lines)
├── accessibility/
│   ├── AccessibilityMenu.tsx        📝 (300 lines)
│   └── AccessibilitySettings.tsx    📝 (200 lines)
└── analytics/
    ├── LiveFeed.tsx                 📝 (200 lines)
    ├── AnalyticsCharts.tsx          📝 (350 lines)
    └── AIInsights.tsx               📝 (250 lines)
```

**Total:** ~3,500 lines across 17 components

---

## Implementation Priority

### High Priority (Core Functionality):
1. ✅ DocumentScanner
2. VoiceButton
3. FraudAlertList
4. AlertCard

### Medium Priority (Enhanced UX):
5. LiveFeed
6. VoiceTranscript
7. AccessibilityMenu
8. AnalyticsCharts

### Low Priority (Nice-to-have):
9. CommandPalette
10. AIInsights
11. Batch components

---

## Shared Hooks Needed

```typescript
// useRealtimePayments.ts
export function useRealtimePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  
  useEffect(() => {
    const channel = supabase
      .channel('payments')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'allocations'
      }, (payload) => {
        setPayments(prev => [payload.new, ...prev]);
      })
      .subscribe();
    
    return () => { channel.unsubscribe(); };
  }, []);
  
  return payments;
}

// useAccessibility.ts (Context API)
export function useAccessibility() {
  // Load/save settings
  // Apply to document
  // Provide update function
}

// useVoiceCommands.ts
export function useVoiceCommands() {
  // Initialize voice system
  // Handle events
  // Provide controls
}
```

---

## Design System Tokens

```typescript
// colors.ts
export const colors = {
  severity: {
    critical: '#ef4444', // red-500
    high: '#f97316',     // orange-500
    medium: '#eab308',   // yellow-500
    low: '#22c55e',      // green-500
  },
  status: {
    pending: '#6b7280',  // gray-500
    success: '#10b981',  // emerald-500
    error: '#ef4444',    // red-500
  }
};

// animations.ts
export const animations = {
  duration: {
    fast: 150,
    normal: 200,
    slow: 300,
  },
  easing: {
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  }
};
```

---

## Next Steps

To complete Phase 3, you would:

1. **Create remaining component files** using the patterns above
2. **Implement shared hooks** for state management
3. **Add to component index** for easy imports
4. **Create demo pages** to showcase each feature
5. **Write component stories** (Storybook if available)
6. **Add unit tests** for critical components

---

**Estimated Completion Time:** 
- Document Scanner: ✅ Complete
- Remaining components: ~6-8 hours for all
- Testing & polish: ~2-3 hours

**Current Status:** 1 of 17 components complete (~5% of Phase 3)

Would you like me to implement more components, or is the pattern clear enough to complete the rest?
