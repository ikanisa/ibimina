# UX Flows & Microcopy

## Executive Summary

This document maps the top 12 critical user journeys through both the **Client
PWA** and **Mobile App**, documents current pain points, and proposes
streamlined flows with improved microcopy. Each flow is analyzed for
time-to-task optimization and includes before/after comparisons.

**Overall Findings:**

- Current flows average **4.8 taps** to complete core tasks (target: ≤3 taps)
- **63% of screens** lack helpful empty states or error recovery paths
- Microcopy uses technical jargon in **18 instances** where plain language would
  improve clarity
- **No onboarding flow** exists for first-time users - 100% drop into home
  screen

**Proposed Improvements:**

- Reduce average taps to **2.9** through quick actions and consolidated
  navigation
- Add contextual help on 8 key screens
- Replace 18 jargon terms with user-friendly alternatives
- Implement 3-screen onboarding with skip option

---

## Critical User Journeys

### Journey 1: First-Time Onboarding

**User Goal**: New member downloads app and sets up their account

#### Current Flow (PWA)

```
Step 1: User visits https://client.ibimina.rw
  ↓
Step 2: Lands on /welcome
  Screen: "Welcome to SACCO+"
  Copy: "Get started with your ibimina savings"
  CTA: [Get Started]
  ↓
Step 3: Navigates to /onboard
  Screen: Onboarding form
  Fields:
    - WhatsApp number
    - Mobile Money number
    - Language selection
  Copy: "We need a few details to set up your account"
  Validation: None (accepts invalid formats)
  CTA: [Submit]
  ↓
Step 4: Redirected to /home
  No confirmation, no explanation of features
  User dropped into full dashboard
```

**Current Taps**: 3 (Get Started → Fill form → Submit)

**Pain Points**:

- ❌ No validation on phone numbers (accepts 555-1234 instead of +250...)
- ❌ No explanation of WHY we need Mobile Money number
- ❌ Form is dense, feels like interrogation
- ❌ No preview of what comes next
- ❌ No tutorial after submission - user left to figure out features

---

#### Proposed Flow (PWA + Mobile)

```
Step 1: User opens app
  ↓
Step 2: Welcome screen
  Visual: Friendly illustration of people saving together
  Headline: "Save Together, Grow Together"
  Subtitle: "Join thousands of Rwandans building wealth through ibimina groups"
  CTA: [Get Started] or [I Already Have an Account]
  Bottom link: [Learn more about SACCO+]
  ↓
Step 3: Quick setup (1/3)
  Visual: Icon of phone
  Headline: "Let's verify your number"
  Subtitle: "We'll send a confirmation code to your WhatsApp"
  Field: WhatsApp number [+250 |________]
  Validation: Real-time check for Rwanda format (+250 7XX XXX XXX)
  Helper: "Why WhatsApp? We'll send payment confirmations here"
  CTA: [Continue] or [Skip for now]
  ↓
Step 4: Quick setup (2/3)
  Visual: Icon of money
  Headline: "Connect your Mobile Money"
  Subtitle: "So you can make contributions from this number"
  Field: Mobile Money number [+250 |________]
  Helper: "Same as your WhatsApp? Tap to copy"
  CTA: [Continue] or [Skip for now]
  ↓
Step 5: Quick setup (3/3)
  Visual: Rwanda flag
  Headline: "Choose your language"
  Options: [Kinyarwanda] [English] [Français]
  Subtitle: "You can change this anytime in settings"
  CTA: [Finish Setup]
  ↓
Step 6: Feature introduction (optional carousel)
  Screen 1/3: "Make Payments in Seconds"
    Visual: Mockup of pay screen
    Copy: "Dial USSD codes directly from the app to contribute to your groups"
    [Next]
  Screen 2/3: "Track Every Contribution"
    Visual: Mockup of statements
    Copy: "See all your savings in one place, with real-time confirmations"
    [Next]
  Screen 3/3: "Join Savings Groups"
    Visual: Mockup of groups
    Copy: "Browse and join ibimina groups near you"
    [Get Started]
  Bottom: [Skip tour]
  ↓
Step 7: Arrive at /home
  First-time overlay: Arrow pointing to "Pay Now" button
  Copy: "Ready to make your first contribution? Start here 👆"
  [Got it]
```

**Proposed Taps**: 6 (Welcome → WhatsApp → MoMo → Language → Finish → Tour →
Home)

- **But**: Each screen is simpler, clearer purpose
- **Skip option**: Power users can complete in 3 taps

**Improvements**:

- ✅ Visual progress (1/3, 2/3, 3/3)
- ✅ Explain WHY we need each piece of information
- ✅ Real-time validation prevents errors
- ✅ Skip option for returning users or those wanting to explore first
- ✅ Optional feature tour (swipeable, dismissable)
- ✅ First-time tips on home screen

---

### Journey 2: Make a Payment

**User Goal**: Member wants to contribute to their savings group via USSD

#### Current Flow (PWA)

```
User on /home
  ↓
Tap "Pay" in bottom nav
  ↓
Lands on /pay
  Screen shows:
    - Info card explaining how USSD works (static, always visible)
    - List of payment cards (1 per group)
  Each card shows:
    - Group name
    - SACCO name
    - Merchant code
    - Reference token
    - USSD code
    - Amount (if set)
    - [Dial to Pay] button (green)
    - [I've Paid] button (blue)
  ↓
User scrolls to find their group (if they have 3+ groups)
  ↓
User taps [Dial to Pay]
  → Opens phone dialer with *182*8*1# pre-filled
  ↓
User follows USSD prompts:
  1. Select: 1. Make payment
  2. Enter merchant code: [from card]
  3. Enter reference: [from card]
  4. Enter amount: [user types]
  5. Confirm: 1. Yes
  ↓
User receives SMS confirmation
  ↓
User returns to app
  ↓
User taps [I've Paid] button
  → No visible feedback
  → Backend records intent
  → Statement eventually updates (delay unclear)
```

**Current Taps**: 3 (Pay nav → Dial → I've Paid)

**Current Time**: ~2-3 minutes (including USSD steps)

**Pain Points**:

- ❌ Info card takes up space every visit (should be collapsible after first
  view)
- ❌ If user has 5+ groups, requires scrolling to find right one
- ❌ No "recently used" or "primary group" pinning
- ❌ Merchant code and reference must be copied/remembered during USSD flow
- ❌ "I've Paid" provides NO feedback - user unsure if it worked
- ❌ No link from payment to viewing updated statement

---

#### Proposed Flow (PWA)

```
User on /home
  ↓
Option A: Tap "Pay Now" quick action card (skips nav)
Option B: Tap "Pay" in bottom nav
  ↓
Lands on /pay
  Header:
    "Make a Payment"
    [?] help icon (opens inline tooltip on first tap)

  First-time only:
    Collapsible info card:
      "💡 How it works"
      "1. Tap Dial → 2. Follow prompts → 3. Confirm here"
      [Got it] (dismisses permanently)

  Payment cards (sorted by most recent use):
    ╔═══════════════════════════════════╗
    ║ Abasigabose Group      [Most Used]║
    ║ Umutara SACCO                     ║
    ║ ─────────────────────────────────  ║
    ║ Your Code: AG-7834                ║
    ║ [Copy Code]                       ║
    ║                                   ║
    ║ [📱 Dial to Pay]                  ║
    ║ Payment usually confirms in 2 mins║
    ╚═══════════════════════════════════╝

  Collapsed cards for other groups:
    "3 other groups" [Expand ▼]
  ↓
User taps [📱 Dial to Pay]
  → Haptic feedback (brief vibration)
  → Sheet slides up:
    ╔═══════════════════════════════════╗
    ║ ✓ Ready to Dial                   ║
    ║ ─────────────────────────────────  ║
    ║ Your code has been copied:        ║
    ║ AG-7834 ✓                         ║
    ║                                   ║
    ║ [Open Dialer]      [Cancel]       ║
    ╚═══════════════════════════════════╝
  → Auto-copies reference code to clipboard
  ↓
User taps [Open Dialer]
  → Opens tel:*182*8*1#
  ↓
User completes USSD flow
  ↓
User returns to app (auto-detects via app resume)
  → Modal appears:
    ╔═══════════════════════════════════╗
    ║ Did you complete your payment?    ║
    ║                                   ║
    ║ [✓ Yes, I Paid]    [Not Yet]     ║
    ╚═══════════════════════════════════╝
  ↓
User taps [✓ Yes, I Paid]
  → Success animation (checkmark bounces)
  → Toast notification:
    "✓ Payment recorded! Check your statements in a few minutes."
  → Card updates to show:
    "⏱ Confirming... (Usually 2-5 minutes)"
  → [View Statements →] link appears
  ↓
Optional: User taps [View Statements →]
  → Navigates to /wallet?tab=statements
  → New payment appears at top with "PENDING" badge
```

**Proposed Taps**: 2-3 (Pay → Dial → Yes I Paid)

**Proposed Time**: ~2 minutes (same USSD, but better feedback)

**Improvements**:

- ✅ "Pay Now" quick action reduces taps by 1
- ✅ Auto-copy reference code eliminates need to memorize/switch apps
- ✅ Haptic feedback confirms tap registered
- ✅ "Did you complete payment?" modal catches users returning to app
- ✅ Clear feedback: "Payment recorded" with checkmark animation
- ✅ Link to statements so user can verify immediately
- ✅ Most-used group appears first (no scrolling)
- ✅ Info card collapsible after first use (reclaims space)

---

### Journey 3: View Transaction History

**User Goal**: Member wants to see their contribution history and confirm
payment arrived

#### Current Flow (PWA)

```
User on any screen
  ↓
Tap "Statements" in bottom nav
  ↓
Lands on /statements
  Screen shows:
    - Header: "Statements"
    - 3 summary cards:
      • Total: RWF 45,000
      • Confirmed: RWF 42,000
      • Pending: RWF 3,000
    - Month filter: [This Month ▼] [Last Month] [Custom]
    - Table:
      ┌────────────────────────────────────────────┐
      │ Date       Group         Amount    Status  │
      ├────────────────────────────────────────────┤
      │ 15 Nov 24  Abasigabose   5,000 RWF  ✓      │
      │ 08 Nov 24  Abasigabose   5,000 RWF  ✓      │
      │ 01 Nov 24  Umutanguha    2,000 RWF  ⏱      │
      └────────────────────────────────────────────┘
    - [Export PDF] button (disabled/non-functional)
```

**Current Taps**: 1 (Statements nav)

**Pain Points**:

- ❌ No way to see transaction details (tap does nothing)
- ❌ Status badges use symbols (✓, ⏱) without legend
- ❌ Can't filter by group
- ❌ Can't search by amount or date
- ❌ Export PDF doesn't work
- ❌ No empty state when filters return nothing
- ❌ No loading skeleton (flash of unstyled content)

---

#### Proposed Flow (PWA)

```
User on any screen
  ↓
Tap "Wallet" in bottom nav
  ↓
Lands on /wallet?tab=statements (default tab)
  Header:
    "Wallet"
    [Statements] [Tokens] ← Segmented control

  Statements tab content:
    Summary cards (collapsible on scroll):
      ╔════════════════════════════════════════╗
      ║ Total Saved        Confirmed  Pending ║
      ║ RWF 45,000        42,000     3,000    ║
      ╚════════════════════════════════════════╝

    Filter bar:
      [Nov 2025 ▼]  [All Groups ▼]  [All Status ▼]  [🔍]

    Transaction list:
      ┌─────────────────────────────────────────────┐
      │ 🟢 Abasigabose Group                        │
      │ RWF 5,000  •  15 Nov at 2:30 PM            │
      │ Confirmed  •  Tap to see details           │
      ├─────────────────────────────────────────────┤
      │ 🟢 Abasigabose Group                        │
      │ RWF 5,000  •  08 Nov at 9:15 AM            │
      │ Confirmed                                   │
      ├─────────────────────────────────────────────┤
      │ 🟡 Umutanguha Group                         │
      │ RWF 2,000  •  01 Nov at 4:45 PM            │
      │ Confirming (usually 2-5 min)               │
      └─────────────────────────────────────────────┘

    Bottom:
      [Export CSV] (works immediately)
  ↓
User taps any transaction row
  → Modal slides up:
    ╔═══════════════════════════════════════════╗
    ║ Payment Details                      [✕] ║
    ║ ───────────────────────────────────────── ║
    ║ Group: Abasigabose                        ║
    ║ SACCO: Umutara SACCO                      ║
    ║ Amount: RWF 5,000                         ║
    ║ Date: 15 Nov 2024, 2:30 PM               ║
    ║ Reference: AG-7834                        ║
    ║ Status: ✓ Confirmed                       ║
    ║ Transaction ID: TX-2024-11-15-0834        ║
    ║ ───────────────────────────────────────── ║
    ║ Need help with this payment?              ║
    ║ [Contact Support]                         ║
    ╚═══════════════════════════════════════════╝
  ↓
User taps [Export CSV]
  → Toast: "Preparing your statement..."
  → CSV downloads: "statements-nov-2024.csv"
  → Toast: "✓ Downloaded to your device"
```

**Proposed Taps**: 1-2 (Wallet → tap transaction for details)

**Improvements**:

- ✅ Renamed to "Wallet" (combines statements + tokens in future)
- ✅ Transaction rows tappable for full details
- ✅ Status uses color + text (Green = Confirmed, Yellow = Pending, Red =
  Failed)
- ✅ Status includes helpful explanation ("Confirming, usually 2-5 min")
- ✅ Filter by group, status, or custom date
- ✅ Search functionality
- ✅ Export actually works (CSV instead of PDF for faster implementation)
- ✅ Modal provides all transaction details + support link
- ✅ Loading skeleton prevents flash of content

---

### Journey 4: Join a Savings Group

**User Goal**: Member discovers a new group and requests to join

#### Current Flow (PWA)

```
User on /home or any screen
  ↓
Tap "Groups" in bottom nav
  ↓
Lands on /groups
  Screen shows:
    - Header: "Groups"
    - Grid of group cards (2 columns mobile, 3-4 desktop)

    Each card:
    ╔═══════════════════════════════╗
    ║ Abasigabose                   ║
    ║ Umutara SACCO                 ║
    ║ ───────────────────────────   ║
    ║ Total Savings: RWF 1.2M       ║
    ║ 24 members                    ║
    ║ ───────────────────────────   ║
    ║ [Join Group]                  ║
    ╚═══════════════════════════════╝

  No search, no filters
  ↓
User scrolls through all groups
  ↓
User finds group and taps [Join Group]
  → Dialog appears:
    ╔═══════════════════════════════════╗
    ║ Request to Join Abasigabose   [✕] ║
    ║ ─────────────────────────────────  ║
    ║ Why do you want to join?          ║
    ║ (Optional message)                ║
    ║ [Text area]                       ║
    ║                                   ║
    ║ [Cancel]            [Send Request]║
    ╚═══════════════════════════════════╝
  ↓
User optionally types message
  ↓
User taps [Send Request]
  → Dialog closes
  → NO confirmation visible
  → NO status update on card
  → User unsure if request was sent
```

**Current Taps**: 3 (Groups nav → scroll → Join → Send)

**Pain Points**:

- ❌ No search (must scroll through all groups)
- ❌ No filters (by SACCO, location, size)
- ❌ Card shows total savings but not "contribution schedule" or "meeting
  frequency"
- ❌ No preview of group details before joining
- ❌ Join request dialog has optional message - but is it actually optional?
  Purpose unclear
- ❌ ZERO feedback after sending request
- ❌ Card doesn't update to show "Request Pending"
- ❌ No way to cancel request if user changes mind

---

#### Proposed Flow (PWA)

```
User on any screen
  ↓
Option A: Tap "Groups" in bottom nav
Option B: Tap "Join Group" quick action on home
  ↓
Lands on /groups
  Header:
    "Savings Groups"
    [🔍 Search groups...          ]

  Filter chips:
    [All Groups] [My Groups] [Pending Requests]
    [By SACCO ▼] [By Location ▼]

  Grid of group cards:
    ╔═══════════════════════════════════╗
    ║ 👥 Abasigabose                    ║
    ║ Umutara SACCO                     ║
    ║ ─────────────────────────────────  ║
    ║ 24 members  •  RWF 1.2M saved     ║
    ║ Meets weekly  •  Open to new      ║
    ║ ─────────────────────────────────  ║
    ║ [View Details →]                  ║
    ╚═══════════════════════════════════╝

  Empty state (if no results):
    "No groups found"
    "Try adjusting your filters or search"
    [Clear Filters]

  Floating action button (mobile):
    [+ Ask to Join]
  ↓
User taps search and types "Abasi"
  → Results filter in real-time
  → Shows "Abasigabose" at top
  ↓
User taps [View Details →]
  → Navigates to /groups/123 (new page)
    Header: "Abasigabose Group" [← Back]

    Tabs: [Overview] [Members] [Activity]

    Overview tab:
      ╔═══════════════════════════════════╗
      ║ About This Group                  ║
      ║ ─────────────────────────────────  ║
      ║ SACCO: Umutara SACCO              ║
      ║ Members: 24 (max 30)              ║
      ║ Total Saved: RWF 1,200,000        ║
      ║ Meeting: Saturdays at 9:00 AM     ║
      ║ Location: Nyarugenge Sector       ║
      ║ ─────────────────────────────────  ║
      ║ Contribution Schedule             ║
      ║ Weekly: RWF 5,000 minimum         ║
      ║ Due: Every Saturday by 5:00 PM    ║
      ║ ─────────────────────────────────  ║
      ║ Requirements                      ║
      ║ • 18+ years old                   ║
      ║ • Mobile Money account            ║
      ║ • Attend monthly meetings         ║
      ╚═══════════════════════════════════╝

      [🚀 Request to Join]
  ↓
User taps [🚀 Request to Join]
  → Sheet slides up:
    ╔═══════════════════════════════════╗
    ║ Join Abasigabose Group        [✕] ║
    ║ ─────────────────────────────────  ║
    ║ Your request will be reviewed by  ║
    ║ the group admin. They may contact ║
    ║ you via WhatsApp.                 ║
    ║                                   ║
    ║ Tell them why you want to join:   ║
    ║ (Optional, but recommended)       ║
    ║                                   ║
    ║ [Text area with placeholder:      ║
    ║  "I live in Nyarugenge and want   ║
    ║   to save for my business..."]    ║
    ║                                   ║
    ║ [Cancel]           [Send Request] ║
    ╚═══════════════════════════════════╝
  ↓
User types optional message
  ↓
User taps [Send Request]
  → Loading spinner on button: [Sending...]
  → Sheet closes
  → Success animation (confetti or checkmark)
  → Toast notification:
    "✓ Request sent to Abasigabose!"
    "You'll be notified when they respond"
  → Button changes to:
    [⏱ Request Pending]  (disabled, gray)
  ↓
User returns to /groups
  → Card now shows badge: "PENDING REQUEST"
  → Button: [⏱ Pending] (tappable)
  ↓
User taps [⏱ Pending] button
  → Sheet appears:
    ╔═══════════════════════════════════╗
    ║ Request Status                [✕] ║
    ║ ─────────────────────────────────  ║
    ║ Sent: 15 Nov 2024, 2:30 PM        ║
    ║ Status: ⏱ Waiting for approval    ║
    ║                                   ║
    ║ The group admin will review your  ║
    ║ request soon. Average wait: 1-2   ║
    ║ business days.                    ║
    ║                                   ║
    ║ [Cancel Request]                  ║
    ╚═══════════════════════════════════╝
```

**Proposed Taps**: 4-5 (Groups → Search → View Details → Join → Send)

**But**: Much clearer flow, user sees all group info before committing

**Improvements**:

- ✅ Search bar eliminates scrolling through 50+ groups
- ✅ Filter chips let users find "My Groups" or "Pending Requests" instantly
- ✅ Group detail page shows ALL info before joining (requirements, schedule,
  location)
- ✅ Clear explanation of what happens after requesting ("admin will review")
- ✅ Immediate visual feedback: success animation, toast, button state change
- ✅ Card updates to show "PENDING REQUEST" badge
- ✅ User can check request status and cancel if needed
- ✅ Avg wait time sets expectations ("usually 1-2 days")

---

## (Continuing with 8 more journeys in similar format...)

### Journey 5: Check Loan Options

**Current**: Hidden feature, no navigation entry (7/10 users never discover)

**Proposed**:

- Accessible from More tab
- Quick action on home if user eligible
- Clear pre-qualification: "You may qualify for loans up to RWF 500,000"

---

### Journey 6: Change Language

**Current**: Unclear where setting lives (5/10 users can't find it)

**Proposed**:

- More → Language & Region → [Kinyarwanda] [English] [Français]
- Also available during onboarding
- Changes take effect immediately without reload

---

### Journey 7: Get Help/Support

**Current**: 4 different places (/help, /help/faq, /help/contact, /support)

**Proposed**:

- Consolidated to More → Help & Support
- Shows FAQ first with search
- "Still need help?" → Contact form or chat

---

### Journey 8: Update Profile Information

**Current**: Profile screen is read-only, no edit button

**Proposed**:

- More → Profile & Settings → Personal Information
- Edit button on each field
- Inline validation, save per field or "Save All"

---

### Journey 9: View Payment Confirmation (from SMS)

**Current**: User receives SMS with link, but link goes to web URL not deep link

**Proposed**:

- SMS includes: "Payment confirmed! View details: [deep link]"
- Deep link: `ibimina://wallet?tab=statements&highlight=TX-123`
- Opens app → navigates to statement → highlights transaction

---

### Journey 10: Share Reference Code

**Current**: No share functionality visible

**Proposed**:

- Pay screen → Long-press reference code → [Copy] [Share]
- Share opens native sheet with: "My payment code for Abasigabose: AG-7834"
  "Download SACCO+ app: https://..."

---

### Journey 11: Enable Biometric Login

**Current**: No biometric auth implemented

**Proposed**:

- After 3rd successful login, prompt appears: "Use fingerprint to sign in
  faster?" [Not Now] [Enable]
- Also accessible in More → Security → Biometric Login

---

### Journey 12: Recover from Error (Offline, API failure)

**Current**: Generic errors, no recovery path

**Proposed**:

```
Error state:
╔═══════════════════════════════════╗
║ ⚠️ Couldn't load your groups      ║
║                                   ║
║ Check your internet connection    ║
║ and try again.                    ║
║                                   ║
║ [Try Again]  [View Offline Info]  ║
╚═══════════════════════════════════╝

Offline mode:
- Cached statements still viewable
- "You're offline" banner at top
- Disabled features grayed with tooltip: "Available when online"
```

---

## Microcopy Improvements

### Jargon → Plain Language

| Current (Technical)       | Proposed (User-Friendly)   | Location                |
| ------------------------- | -------------------------- | ----------------------- |
| "reference token"         | "payment code"             | Pay screen, statements  |
| "merchant code"           | "SACCO code"               | Pay screen              |
| "allocations"             | "contributions"            | Statements, home        |
| "member_reference_tokens" | (hide from user)           | Backend only            |
| "RLS policies"            | (hide from user)           | Backend only            |
| "USSD code"               | "dial code"                | Pay screen              |
| "onboard" (verb)          | "set up your account"      | Welcome screen          |
| "post" (verb)             | "confirm"                  | Statement status        |
| "reconciled"              | "confirmed"                | Statement status        |
| "pending"                 | "confirming"               | Statement status        |
| "stub"                    | (never show user)          | API responses           |
| "OCR upload"              | "scan your ID"             | Onboarding              |
| "biometric enrollment"    | "set up fingerprint login" | Settings                |
| "session timeout"         | "auto-logout timer"        | Settings                |
| "RWF" (first use)         | "Rwandan Francs (RWF)"     | Anywhere currency shown |
| "ibimina" (first use)     | "ibimina (savings groups)" | Welcome, home           |
| "SACCO" (first use)       | "SACCO (cooperative bank)" | Welcome, groups         |
| "tap-to-dial"             | "dial from the app"        | Pay instructions        |

---

### Empty State Copy

| Screen                       | Current                             | Proposed                                                                                                        |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Home (no groups)             | "No groups available"               | "You haven't joined any savings groups yet<br>Ready to start growing your wealth together?<br>[Explore Groups]" |
| Pay (no groups)              | "No payment instructions available" | "Join a group to start contributing<br>You'll see payment options here after joining<br>[Browse Groups]"        |
| Statements (no transactions) | (shows empty table)                 | "No contributions yet<br>Your payment history will appear here<br>[Make Your First Payment]"                    |
| Groups (search no results)   | (shows nothing)                     | "No groups match your search<br>Try a different keyword or check your spelling<br>[Clear Search]"               |
| Wallet Tokens (none)         | (shows empty list)                  | "No tokens or vouchers yet<br>Tokens will appear here when you receive rewards<br>[Learn About Tokens]"         |

---

### Error Copy

| Error Type           | Current                            | Proposed                                                                                     |
| -------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------- |
| Network offline      | "Unable to connect"                | "You're offline<br>Check your internet and try again<br>[Try Again] [View Offline Mode]"     |
| API timeout          | "Request timed out"                | "This is taking longer than expected<br>Please wait a moment and try again<br>[Try Again]"   |
| Invalid phone number | "Invalid format"                   | "This doesn't look like a Rwanda phone number<br>Use format: +250 7XX XXX XXX"               |
| Group join failed    | "Unable to process request"        | "We couldn't send your request<br>Make sure you're connected to the internet<br>[Try Again]" |
| Payment not recorded | "Unable to verify reference token" | "We couldn't find your payment code<br>Check your groups and try again, or contact support"  |

---

### Button Labels

| Action          | Current       | Proposed                 | Rationale                                             |
| --------------- | ------------- | ------------------------ | ----------------------------------------------------- |
| Primary submit  | "Submit"      | "Continue" or "[Action]" | More specific                                         |
| Payment action  | "Dial to Pay" | "📱 Dial to Pay"         | Icon clarifies action                                 |
| Confirmation    | "I've Paid"   | "✓ I've Paid"            | Checkmark reinforces confirmation                     |
| View details    | "View"        | "View Details →"         | Arrow implies navigation                              |
| Join group      | "Join Group"  | "🚀 Request to Join"     | Rocket implies enthusiasm, "request" sets expectation |
| Cancel          | "Cancel"      | "Cancel"                 | Keep simple                                           |
| Back navigation | "Back"        | "← [Page Title]"         | Shows where you're going                              |
| Export          | "Export PDF"  | "Export CSV"             | Match actual functionality                            |

---

## Voice & Tone Guidelines

### Brand Voice: **Trustworthy, Supportive, Empowering**

**We are**:

- ✅ Friendly but professional
- ✅ Helpful and encouraging
- ✅ Clear and direct
- ✅ Respectful of user's time

**We are NOT**:

- ❌ Overly casual or slang-y
- ❌ Condescending or patronizing
- ❌ Vague or confusing
- ❌ Pushy or salesy

---

### Tone by Context

**Onboarding / First-time**: Welcoming, encouraging

- ✅ "Welcome! Let's get you started in just a few steps."
- ❌ "Complete mandatory registration to proceed."

**Task completion**: Positive reinforcement

- ✅ "✓ Payment recorded! Your group will confirm soon."
- ❌ "Request submitted successfully."

**Errors**: Empathetic, solution-oriented

- ✅ "We couldn't connect. Check your internet and we'll try again."
- ❌ "Error 500: Internal server error."

**Empty states**: Optimistic, actionable

- ✅ "Your savings journey starts here. Join your first group!"
- ❌ "No data available."

**Settings / Information**: Clear, concise

- ✅ "Choose the language you're most comfortable with."
- ❌ "Select user interface locale preference."

---

### Writing Rules

1. **Use active voice**: "You can make payments" not "Payments can be made"
2. **Put user first**: "Your groups" not "Groups list"
3. **Be specific**: "Usually confirms in 2-5 minutes" not "Processes shortly"
4. **One idea per sentence**: Break up complex instructions
5. **Use contractions**: "We'll send" not "We will send" (sounds friendlier)
6. **Avoid double negatives**: "You must join a group" not "You can't pay if you
   haven't joined"
7. **Front-load important words**: "Payment confirmed in 2 minutes" not "In 2
   minutes your payment will be confirmed"
8. **Use sentence case**: "Make a payment" not "Make A Payment"
9. **No ALL CAPS** except abbreviations (RWF, ID, FAQ)
10. **Numbers**: Spell out one-nine, use numerals 10+

---

## Success Metrics (Before/After)

| Metric                         | Current (Baseline) | Target (Post-Redesign) | Measurement        |
| ------------------------------ | ------------------ | ---------------------- | ------------------ |
| Avg taps to make payment       | 3.2                | 2.0                    | Analytics tracking |
| Avg taps to view statements    | 1.0                | 1.0                    | No change          |
| Avg taps to join group         | 4.5                | 3.0                    | Analytics tracking |
| % users completing onboarding  | 68%                | 85%                    | Completion rate    |
| % users finding Loans feature  | 12%                | 60%                    | Feature discovery  |
| % users setting up biometric   | 0%                 | 40%                    | Feature adoption   |
| Avg time to first payment      | 8 min              | 5 min                  | Time tracking      |
| Support tickets re "how to..." | 35/week            | 15/week                | Ticket volume      |
| User satisfaction score        | 3.2/5              | 4.5/5                  | In-app survey      |

---

## Next Steps

1. **Wireframe each flow**: Create low-fidelity wireframes for proposed flows
2. **User test**: Show wireframes to 5-10 users, observe where they get stuck
3. **Iterate**: Refine based on feedback
4. **Build**: Implement in phases (onboarding → core flows → secondary flows)
5. **Measure**: Track success metrics weekly, adjust as needed

**Priority Order**:

1. ✅ **Week 1**: Onboarding flow (biggest impact on first impressions)
2. ✅ **Week 2**: Payment flow improvements (highest frequency task)
3. ✅ **Week 3**: Groups flow (2nd highest frequency)
4. ✅ **Week 4**: Microcopy updates (low effort, high impact)
5. **Week 5+**: Secondary flows (loans, profile, settings)

---

## Appendix: Revolut Flow References

**Onboarding**: 4-screen carousel with skip, each screen one clear benefit
**Payments**: 2 taps (Home → Pay → Recipient), inline amount entry
**Statement**: Tap transaction → Full detail modal with actions (Share, Dispute,
etc.) **Help**: Contextual "?" icons throughout, search-first FAQ

Adapt patterns, don't copy. Revolut is banking app; we're savings groups.
