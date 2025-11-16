# Step-by-Step Implementation Plan

# SACCO+ Full UI/UX Redesign

**Priority:** Execute in order - P0 first, then P1, then P2 **Estimated Total
Time:** 6-10 weeks with 2 developers

---

## 🔥 CRITICAL PATH: P0 Blockers (Must Complete First)

These items BLOCK production deployment. Execute immediately.

### P0.1: Staff Mobile - Remove SMS Permissions (3 hours) 🚨

**Why Critical:** Google Play will reject the app with SMS permissions.

**Files to Modify:**

1. Find the Android manifest:

```bash
find apps -name "AndroidManifest.xml" -path "*/admin/*" -o -path "*/staff-mobile*"
```

2. Edit the manifest and REMOVE these lines:

```xml
<uses-permission android:name="android.permission.READ_SMS" />
<uses-permission android:name="android.permission.RECEIVE_SMS" />
<uses-permission android:name="android.permission.SEND_SMS" />
```

3. KEEP these lines (notification listener is allowed):

```xml
<service
  android:name=".MoMoNotificationListener"
  android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE"
  android:exported="false">
  <intent-filter>
    <action android:name="android.service.notification.NotificationListenerService" />
  </intent-filter>
</service>

<uses-permission android:name="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE" />
```

4. Test the build:

```bash
cd apps/admin/android  # or apps/staff-mobile-android
./gradlew clean
./gradlew assembleDebug
```

5. Verify SMS parsing still works via notifications.

**Acceptance Criteria:**

- [ ] SMS permissions removed from manifest
- [ ] App builds successfully
- [ ] Notification listener service still present
- [ ] Can receive mobile money notifications
- [ ] Can parse SMS from notifications

---

### P0.2: Remove All Firebase Dependencies (4 hours)

**Search and destroy mission:**

```bash
# Find all Firebase imports
grep -r "from 'firebase" apps/client apps/admin --include="*.ts" --include="*.tsx" --include="*.js"
grep -r "import firebase" apps/client apps/admin --include="*.ts" --include="*.tsx" --include="*.js"

# Find Firebase config files (should return nothing)
find apps -name "google-services.json" -o -name "GoogleService-Info.plist" -o -name "firebase.json"

# Find Firebase SDK in package.json files
grep -r "firebase" apps/*/package.json
```

**For each Firebase import found:**

1. **Authentication:** Replace with Supabase

```typescript
// OLD (Firebase)
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

// NEW (Supabase)
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
await supabase.auth.signInWithPassword({ email, password });
```

2. **Push Notifications:** Replace with Supabase

```typescript
// OLD (Firebase Messaging)
import { getMessaging, getToken } from "firebase/messaging";

// NEW (Supabase Realtime or custom push)
// Use Supabase Realtime for web push
// Or integrate with native push notification services
```

3. **Remove from package.json:**

```bash
cd apps/client  # or apps/admin
pnpm remove firebase
pnpm install
```

**Acceptance Criteria:**

- [ ] No Firebase imports in codebase
- [ ] No Firebase packages in package.json files
- [ ] No Firebase config files
- [ ] All auth flows use Supabase
- [ ] Push notifications work (via Supabase or native)

---

### P0.3: Fix Color Contrast Issues (2 hours)

**Problem:** `text-neutral-600` on white background = 3.8:1 ratio (fails WCAG AA
4.5:1 requirement)

**Solution:** Replace with `text-neutral-700` = 7.0:1 ratio

**Files to update:** All component and page files

```bash
# Find all instances
grep -r "text-neutral-600" apps/client apps/admin apps/website --include="*.tsx" --include="*.jsx"

# Replace (use your editor's find & replace)
# Find: text-neutral-600
# Replace with: text-neutral-700

# Or use sed (be careful!)
find apps/client -name "*.tsx" -exec sed -i '' 's/text-neutral-600/text-neutral-700/g' {} +
find apps/admin -name "*.tsx" -exec sed -i '' 's/text-neutral-600/text-neutral-700/g' {} +
```

**Test:**

1. Run contrast checker on updated pages
2. Verify all secondary text is readable
3. Check both light and dark themes (if applicable)

**Acceptance Criteria:**

- [ ] All text contrast ratios ≥ 4.5:1 for normal text
- [ ] All text contrast ratios ≥ 3:1 for large text (18pt+)
- [ ] Tested with WAVE or axe DevTools
- [ ] Visual review confirms readability

---

### P0.4: Add Keyboard Navigation (6 hours)

**Problem:** Many clickable elements use `<div onClick>` without keyboard
support.

**Solution:** Convert to `<button>` or add keyboard handling.

**Pattern 1: Convert div to button**

```tsx
// BEFORE (bad)
<div onClick={handleClick} className="cursor-pointer">
  Click me
</div>

// AFTER (good)
<button onClick={handleClick} className="...">
  Click me
</button>
```

**Pattern 2: Add keyboard handling to divs** (if button isn't semantic)

```tsx
// BEFORE (bad)
<div onClick={handleClick}>
  Card content
</div>

// AFTER (good)
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  Card content
</div>
```

**Files to check:**

- Group cards
- Payment cards
- Navigation items
- Modal close buttons
- Filter chips
- Any element with `onClick` or `cursor-pointer`

**Test:**

1. Tab through entire app
2. Verify focus visible on all interactive elements
3. Test Enter and Space keys activate buttons
4. Verify focus order matches visual order

**Acceptance Criteria:**

- [ ] All interactive elements reachable with Tab key
- [ ] Focus visible states present (outline or ring)
- [ ] Enter/Space keys activate buttons/links
- [ ] Focus order logical (left-to-right, top-to-bottom)
- [ ] No keyboard traps

---

### P0.5: Add Loading States (4 hours)

**Problem:** Data fetches show blank screens or stale content.

**Solution:** Add Suspense boundaries + skeleton loaders.

**Step 1: Create Skeleton Components** (if not exist)

```tsx
// components/ui/Skeleton.tsx
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-neutral-200 rounded ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="border border-neutral-200 rounded-xl p-6 space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}
```

**Step 2: Wrap async components with Suspense**

```tsx
// app/dashboard/page.tsx
import { Suspense } from "react";
import { DashboardContent } from "./dashboard-content";
import { CardSkeleton } from "@/components/ui/Skeleton";

export default function DashboardPage() {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
```

**Step 3: Add loading states to data hooks**

```typescript
// hooks/useGroups.ts
export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchGroups() {
      try {
        setLoading(true);
        const data = await supabase.from('groups').select('*');
        setGroups(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    fetchGroups();
  }, []);

  return { groups, loading, error };
}

// Component usage
function GroupsList() {
  const { groups, loading, error } = useGroups();

  if (loading) return <CardSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (groups.length === 0) return <EmptyState />;

  return <div>{/* render groups */}</div>;
}
```

**Files to update:**

- All pages with data fetching
- All components that call APIs
- All list/table components

**Acceptance Criteria:**

- [ ] No blank screens during loading
- [ ] Skeleton loaders match final content layout
- [ ] Loading states for all async operations
- [ ] Smooth transition from skeleton to content
- [ ] Loading indicators accessible (aria-live="polite")

---

### P0.6: Fix Form Validation (3 hours)

**Problem:** Validation errors not associated with form fields.

**Solution:** Use `aria-describedby` to link errors to inputs.

**Pattern:**

```tsx
// BEFORE (bad)
<form>
  {error && <p className="text-error-600">{error}</p>}
  <input type="email" name="email" />
</form>

// AFTER (good)
<form>
  <div>
    <label htmlFor="email">Email</label>
    <input
      id="email"
      type="email"
      name="email"
      aria-invalid={!!emailError}
      aria-describedby={emailError ? "email-error" : undefined}
      className={emailError ? "border-error-500" : "border-neutral-300"}
    />
    {emailError && (
      <p id="email-error" className="text-error-600 text-sm mt-1">
        {emailError}
      </p>
    )}
  </div>
</form>
```

**Files to update:**

- Contact form
- Login/signup forms
- Profile update forms
- Payment forms
- Group join request forms

**Acceptance Criteria:**

- [ ] All form inputs have labels (htmlFor/id)
- [ ] Validation errors linked via aria-describedby
- [ ] Error state visible (red border + icon)
- [ ] Errors announced by screen readers
- [ ] Inline validation (not just on submit)

---

### P0.7: Add Alt Text to Images (1 hour)

**Problem:** Images missing `alt` attributes.

**Solution:** Add descriptive alt text or `alt=""` if decorative.

**Rules:**

- **Informative images:** Describe what the image shows
- **Functional images:** Describe what happens when clicked
- **Decorative images:** Use `alt=""`

```tsx
// Informative
<img src="/group-photo.jpg" alt="Members of Gasabo savings group at monthly meeting" />

// Functional
<img src="/edit-icon.svg" alt="Edit profile" />

// Decorative
<img src="/background-pattern.svg" alt="" />
```

**Files to check:**

- Group cards with images
- User avatars
- Icons (if using img tags)
- Marketing images on homepage

**Test:**

1. Turn on screen reader
2. Navigate through app
3. Verify all images are announced appropriately

**Acceptance Criteria:**

- [ ] All `<img>` tags have `alt` attribute
- [ ] Alt text is descriptive (not "image" or "photo")
- [ ] Decorative images have empty alt (`alt=""`)
- [ ] Icon images describe function not appearance

---

### P0.8: Generic Error Messages (3 hours)

**Problem:** Technical error messages like "Unable to verify reference token".

**Solution:** User-friendly messages with recovery actions.

**Pattern:**

```typescript
// utils/errorMessages.ts
export function getErrorMessage(error: Error | string): {
  title: string;
  message: string;
  action?: string;
} {
  const errorStr = typeof error === "string" ? error : error.message;

  if (errorStr.includes("reference token")) {
    return {
      title: "Payment code not found",
      message:
        "We couldn't find that payment code. Please check your groups and try again.",
      action: "View My Groups",
    };
  }

  if (errorStr.includes("network")) {
    return {
      title: "Connection error",
      message: "Please check your internet connection and try again.",
      action: "Retry",
    };
  }

  // Generic fallback
  return {
    title: "Something went wrong",
    message: "We're having trouble completing that action. Please try again.",
    action: "Retry",
  };
}
```

**Component:**

```tsx
// components/ErrorState.tsx
export function ErrorState({ error, onRetry }: Props) {
  const { title, message, action } = getErrorMessage(error);

  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle size={32} className="text-error-600" />
      </div>
      <h3 className="text-xl font-semibold text-neutral-900 mb-2">{title}</h3>
      <p className="text-neutral-700 mb-6 max-w-md mx-auto">{message}</p>
      {onRetry && <Button onClick={onRetry}>{action || "Try Again"}</Button>}
    </div>
  );
}
```

**Files to update:**

- All API error handlers
- All try/catch blocks
- All error boundaries

**Acceptance Criteria:**

- [ ] No technical error messages shown to users
- [ ] All errors have clear, friendly language
- [ ] All errors include recovery action when possible
- [ ] Errors logged to console/Sentry for debugging

---

### P0.9: Mobile Emoji Icons (2 hours)

**Problem:** Bottom tab bar uses emoji icons (not accessible, don't scale).

**Solution:** Replace with proper vector icons.

**Choose icon library:**

- `@expo/vector-icons` (if React Native/Expo)
- `react-icons`
- `lucide-react`
- `@tabler/icons-react`

**Install:**

```bash
cd apps/mobile  # or apps/client-mobile
pnpm add lucide-react
```

**Replace:**

```tsx
// BEFORE (bad)
<Tab.Screen
  name="Home"
  options={{
    tabBarLabel: "Home",
    tabBarIcon: () => <Text>🏠</Text>,
  }}
/>;

// AFTER (good)
import { Home, CreditCard, Wallet, Users, MoreHorizontal } from "lucide-react";

<Tab.Screen
  name="Home"
  options={{
    tabBarLabel: "Home",
    tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
  }}
/>;
```

**Recommended icon mapping:**

- Home: `Home` or `LayoutDashboard`
- Pay: `CreditCard` or `Send`
- Wallet: `Wallet` or `PiggyBank`
- Groups: `Users` or `UsersRound`
- More: `MoreHorizontal` or `Menu`

**Acceptance Criteria:**

- [ ] No emoji in UI (except user content)
- [ ] All icons use vector library
- [ ] Icons scale properly at all sizes
- [ ] Icons work with screen readers
- [ ] Icons support color theming

---

## ✅ P0 Checklist Summary

Before moving to P1, verify ALL P0 items complete:

- [ ] P0.1: SMS permissions removed from staff mobile
- [ ] P0.2: No Firebase dependencies remain
- [ ] P0.3: All text contrast ≥ 4.5:1
- [ ] P0.4: All interactive elements keyboard accessible
- [ ] P0.5: Loading states on all async operations
- [ ] P0.6: Form errors properly associated
- [ ] P0.7: All images have alt text
- [ ] P0.8: All error messages user-friendly
- [ ] P0.9: No emoji icons in mobile apps

**Test:**

1. Run full accessibility audit (axe DevTools)
2. Test with keyboard only
3. Test with screen reader
4. Test all forms
5. Build all apps (no errors)

**Once P0 complete:**

- Run builds for all apps
- Deploy to staging
- User testing with 5-10 users
- Fix critical bugs
- THEN move to P1

---

## 🟠 P1: Major Issues (High Priority)

Execute after P0 complete. These significantly improve UX but don't block
deployment.

### P1.1: Implement 5-Tab Navigation (1 week)

**Current:** 23 routes but only 5 in bottom nav - features hidden

**Solution:** Consolidate into 5 primary tabs

**New IA:**

```
1. Home
   - Dashboard
   - Quick actions
   - Recent activity

2. Pay
   - USSD payment flow
   - Payment history
   - Reference tokens

3. Wallet
   - Statements (formerly separate tab)
   - Balance overview
   - Transaction history
   - Export statements

4. Groups
   - My groups
   - Join group
   - Group details

5. More
   - Profile
   - Settings
   - Help & FAQ
   - Loans (if applicable)
   - About
   - Logout
```

**Implementation:**

```tsx
// navigation/BottomTabs.tsx
const tabs = [
  { name: "Home", icon: Home, component: HomeScreen },
  { name: "Pay", icon: CreditCard, component: PayScreen },
  { name: "Wallet", icon: Wallet, component: WalletScreen },
  { name: "Groups", icon: Users, component: GroupsScreen },
  { name: "More", icon: MoreHorizontal, component: MoreScreen },
];
```

**More tab layout:**

```tsx
// screens/MoreScreen.tsx
export function MoreScreen() {
  return (
    <ScrollView>
      <ProfileCard />
      <MenuSection title="Account">
        <MenuItem icon={User} label="Profile" onPress={goToProfile} />
        <MenuItem icon={Settings} label="Settings" onPress={goToSettings} />
      </MenuSection>
      <MenuSection title="Support">
        <MenuItem icon={HelpCircle} label="Help & FAQ" onPress={goToHelp} />
        <MenuItem
          icon={MessageSquare}
          label="Contact Support"
          onPress={goToContact}
        />
      </MenuSection>
      <MenuSection title="About">
        <MenuItem icon={Info} label="About SACCO+" onPress={goToAbout} />
        <MenuItem icon={FileText} label="Terms & Privacy" onPress={goToLegal} />
      </MenuSection>
      <MenuItem
        icon={LogOut}
        label="Logout"
        destructive
        onPress={handleLogout}
      />
    </ScrollView>
  );
}
```

**Acceptance Criteria:**

- [ ] 5 tabs only in bottom navigation
- [ ] All 23 routes accessible via new IA
- [ ] Feature discovery increased (test with users)
- [ ] No functionality removed
- [ ] Navigation smooth and intuitive

---

### P1.2: Standardize Button Components (2 days)

**Problem:** 5 different button styles across the app

**Solution:** Migrate all to shared Button component

**Button component already created:** `components/ui/Button.tsx`

**Find all custom buttons:**

```bash
grep -r "className.*button" apps/client --include="*.tsx" | grep -v "ui/Button"
grep -r "className.*btn" apps/client --include="*.tsx"
```

**Migration pattern:**

```tsx
// BEFORE
<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  Click me
</button>

// AFTER
<Button variant="primary">Click me</Button>

// BEFORE
<button className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-sm">
  Cancel
</button>

// AFTER
<Button variant="outline" size="sm">Cancel</Button>
```

**Variant mapping:**

- Blue primary button → `variant="primary"`
- Gray secondary → `variant="secondary"`
- White with border → `variant="outline"`
- Transparent → `variant="ghost"`
- Red destructive → `variant="danger"`

**Acceptance Criteria:**

- [ ] All buttons use Button component
- [ ] No custom button classes (except edge cases)
- [ ] Design consistency 95%+
- [ ] Visual regression test passed

---

### P1.3: Add Quick Actions (1 day)

**Problem:** Expert users must navigate through tabs for common tasks

**Solution:** Add shortcut cards to home screen

```tsx
// components/QuickActions.tsx
export function QuickActions() {
  const quickActions = [
    {
      id: "pay-now",
      icon: CreditCard,
      label: "Pay Now",
      description: "Make a payment",
      href: "/pay",
      color: "brand-blue",
    },
    {
      id: "view-statement",
      icon: FileText,
      label: "View Statement",
      description: "See transactions",
      href: "/wallet/statements",
      color: "brand-yellow",
    },
    {
      id: "join-group",
      icon: UserPlus,
      label: "Join Group",
      description: "Request to join",
      href: "/groups/join",
      color: "brand-green",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {quickActions.map((action) => (
        <Link
          key={action.id}
          href={action.href}
          className="flex flex-col items-center p-4 bg-white border border-neutral-200 rounded-xl hover:shadow-md transition-shadow"
        >
          <div
            className={`w-12 h-12 rounded-full bg-${action.color}/10 flex items-center justify-center mb-3`}
          >
            <action.icon size={24} className={`text-${action.color}`} />
          </div>
          <span className="font-semibold text-sm text-neutral-900">
            {action.label}
          </span>
          <span className="text-xs text-neutral-600 mt-1">
            {action.description}
          </span>
        </Link>
      ))}
    </div>
  );
}
```

**Add to home screen:**

```tsx
// app/(tabs)/home.tsx
<View>
  <QuickActions />
  <RecentGroups />
  <RecentActivity />
</View>
```

---

### P1.4: Improve Microcopy (2 days)

**Problem:** 18 instances of technical jargon

**Solution:** Plain language replacements

**Jargon dictionary:**

| Technical            | Plain Language       |
| -------------------- | -------------------- |
| Reference token      | Payment code         |
| Allocations          | Contributions        |
| Merchant code        | SACCO code           |
| USSD code            | Payment dial code    |
| Ikimina              | Savings group        |
| Pending verification | Being reviewed       |
| Failed to verify     | Couldn't confirm     |
| Unable to process    | Something went wrong |

**Implementation:**

```typescript
// lib/glossary.ts
export const glossary = {
  referenceToken: 'Payment code',
  allocation: 'Contribution',
  merchantCode: 'SACCO code',
  ussdCode: 'Dial code',
  ikimina: 'Savings group',
  // ... more
};

// Use in components
import { glossary } from '@/lib/glossary';

<span>Your {glossary.referenceToken}</span>
```

**Files to update:**

- All user-facing copy
- Button labels
- Form labels
- Error messages
- Help text

**Test:**

- Ask 5 non-technical users to explain terms
- Must be understood without context

---

### P1.5: Optimize User Flows (1 week)

**Goal:** Reduce average taps from 4.8 to 2.9

**Key flows to optimize:**

1. **Make Payment:** 5 taps → 3 taps

   ```
   OLD: Home → Groups → Select Group → Pay → Confirm → Dial
   NEW: Home → Pay (pre-selected group) → Dial
   ```

2. **View Statement:** 4 taps → 2 taps

   ```
   OLD: Home → Menu → Statements → Select Group
   NEW: Home → Wallet (latest statement shown)
   ```

3. **Join Group:** 6 taps → 3 taps
   ```
   OLD: Home → Menu → Groups → Browse → Select → Request → Confirm
   NEW: Home → Groups (browse) → Request (one tap)
   ```

**Implementation strategies:**

- Default selections (most recent group, most common amount)
- Persistent state (remember last used values)
- Progressive disclosure (show common options first)
- Smart suggestions (based on usage patterns)

---

## 🟡 P2: Minor Issues (Nice to Have)

Execute after P1 if time permits.

### P2.1: Add Search to Groups

### P2.2: Implement CSV Export

### P2.3: Add Gesture Shortcuts

### P2.4: Create Onboarding Tutorial

### P2.5: Add In-App Help

(Details omitted for brevity - see full audit for specs)

---

## 🎯 Implementation Schedule

### Week 1-2: P0 Blockers

- Day 1-2: Staff mobile (SMS permissions)
- Day 3-4: Client PWA (contrast + keyboard)
- Day 5: Mobile apps (Firebase removal)
- Day 6-7: Loading states + form validation
- Day 8-10: Error messages + alt text + emoji icons

### Week 3-4: P1 Major Issues

- Day 11-13: 5-tab navigation
- Day 14-15: Button standardization
- Day 16-17: Quick actions + microcopy
- Day 18-20: User flow optimization

### Week 5-6: Testing & Polish

- Day 21-22: Full accessibility audit
- Day 23-24: User testing (10-15 users)
- Day 25-27: Bug fixes
- Day 28-30: Documentation + deployment

### Week 7-10: P2 & Mobile Apps (if needed)

- Client mobile app full refactor
- Staff mobile additional features
- Advanced optimizations
- Performance tuning

---

## 📊 Success Metrics

Track weekly:

1. **Accessibility**
   - WCAG compliance: 60% → 100%
   - axe violations: Count weekly
   - Screen reader tested: All critical flows

2. **Efficiency**
   - Avg taps to task: 4.8 → 2.9
   - Time to first paint: < 2s
   - Time to interactive: < 3s

3. **Usability**
   - Feature discovery: 12% → 60%
   - Task completion rate: 70% → 95%
   - User satisfaction: 3.2/5 → 4.5/5

4. **Support**
   - Tickets per week: 35 → 15
   - Resolution time: Measure weekly
   - Common issues: Track top 5

---

## 🚀 Deployment Checklist

Before deploying each phase:

**Pre-Deploy:**

- [ ] All P0 items complete
- [ ] All builds successful
- [ ] No TypeScript errors
- [ ] All tests passing
- [ ] Accessibility audit clean
- [ ] Load testing complete
- [ ] Security audit passed

**Deploy:**

- [ ] Deploy to staging
- [ ] Smoke tests passed
- [ ] User acceptance testing
- [ ] Rollback plan ready
- [ ] Deploy to production
- [ ] Monitor for 24 hours

**Post-Deploy:**

- [ ] Analytics tracking working
- [ ] Error rates normal
- [ ] Performance metrics good
- [ ] User feedback collected
- [ ] Document lessons learned

---

## 📚 Resources

**Documentation:**

- `/docs/ui-ux-audit/` - Full audit
- `/FULL_UI_UX_IMPLEMENTATION_STATUS.md` - Status tracker
- Component library docs (create as you build)

**Tools:**

- axe DevTools - Accessibility testing
- Lighthouse - Performance
- WAVE - Accessibility scanner
- React DevTools - Debugging
- Supabase Dashboard - Database

**Testing:**

- Manual keyboard testing
- Screen reader testing (VoiceOver/NVDA)
- Mobile device testing (real devices)
- Cross-browser testing

---

**Good luck with the implementation!** 🚀

Start with P0.1 (Staff Mobile SMS permissions) - it's the most critical blocker.
