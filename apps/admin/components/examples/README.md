# Native capability simulations

These examples illustrate how the staff dashboard now simulates native
behaviours without the Capacitor bridge. They provide UI patterns and copy you
can reuse while the real Android app owns the underlying functionality.

## Available Examples

### NotificationExample

Demonstrates the messaging that mirrors Android push alerts. The component:

- Requests browser notification permission when available (purely for demo
  purposes).
- Generates sample transaction, alert, and digest messages.
- Documents how the production Android build escalates failures.

**Usage**:

```tsx
import { NotificationExample } from "@/components/examples";

export default function DemoPage() {
  return <NotificationExample />;
}
```

### NetworkMonitorExample

Shows how the dashboard surfaces browser network telemetry as a stand-in for the
Android network monitor. The component:

- Reads `navigator.onLine` and `navigator.connection` where available.
- Captures a short history of changes to mirror the native event stream.
- Explains how the staff app extends these details (metered detection, analytics
  hooks).

**Usage**:

```tsx
import { NetworkMonitorExample } from "@/components/examples";

export default function DemoPage() {
  return <NetworkMonitorExample />;
}
```

## Notes for engineers

- The production Android build still owns push notifications and deep network
  telemetry. These examples only provide the web affordances so the dashboard
  can render without the Capacitor bridge.
- When embedding them in documentation or storybooks, wrap in client
  components—their logic depends on browser APIs such as `Notification` and
  `navigator.connection`.
