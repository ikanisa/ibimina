# Feature Flags Documentation

## Overview

The SACCO+ application uses a feature flag system to enable/disable experimental
or beta features without requiring code deployments. This allows for:

- **Gradual rollouts**: Test new features with a subset of users
- **A/B testing**: Compare different implementations
- **Quick rollback**: Disable problematic features instantly
- **Environment-specific features**: Enable features only in specific
  environments
- **Beta testing**: Allow early access to new functionality

## Architecture

The feature flag system is built using React Context and environment variables,
making it lightweight and easy to use without external dependencies.

### Components

1. **FeatureFlagProvider**: React Context provider that wraps the application
2. **useFeatureFlags**: React hook for accessing feature flags in components
3. **Environment Variables**: Configuration through `NEXT_PUBLIC_FEATURE_FLAG_*`
   variables

## Usage

### Setting Up Feature Flags

#### 1. Configure Environment Variables

Add feature flags to your `.env.local` or environment configuration:

```bash
# Enable web push notifications
NEXT_PUBLIC_FEATURE_FLAG_WEB_PUSH=true

# Disable beta features
NEXT_PUBLIC_FEATURE_FLAG_BETA_FEATURES=false

# Enable new UI
NEXT_PUBLIC_FEATURE_FLAG_NEW_UI=true
```

**Important**: Feature flag environment variables must be prefixed with
`NEXT_PUBLIC_` to be accessible in the browser.

#### 2. Wrap Your Application

In your root layout or app component:

```tsx
import { FeatureFlagProvider } from "@/components/FeatureFlagProvider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <FeatureFlagProvider>{children}</FeatureFlagProvider>
      </body>
    </html>
  );
}
```

#### 3. Use Feature Flags in Components

```tsx
import { useFeatureFlags } from "@/hooks/use-feature-flags";

export function MyComponent() {
  const { isEnabled } = useFeatureFlags();

  if (isEnabled("web-push")) {
    return <NewPushNotificationUI />;
  }

  return <LegacyUI />;
}
```

## Available Feature Flags

### Current Feature Flags

| Flag Name            | Environment Variable                          | Description                                         | Default |
| -------------------- | --------------------------------------------- | --------------------------------------------------- | ------- |
| `web-push`           | `NEXT_PUBLIC_FEATURE_FLAG_WEB_PUSH`           | Enable Web Push notifications                       | `false` |
| `beta-features`      | `NEXT_PUBLIC_FEATURE_FLAG_BETA_FEATURES`      | Enable all beta features                            | `false` |
| `new-ui`             | `NEXT_PUBLIC_FEATURE_FLAG_NEW_UI`             | Enable new UI components                            | `false` |
| `command-palette`    | `NEXT_PUBLIC_FEATURE_FLAG_COMMAND_PALETTE`    | Enable Atlas command palette for staff console      | `false` |
| `atlas-assistant`    | `NEXT_PUBLIC_FEATURE_FLAG_ATLAS_ASSISTANT`    | Toggle Atlas AI assistant chat surface              | `false` |
| `offline-banner`     | `NEXT_PUBLIC_FEATURE_FLAG_OFFLINE_BANNER`     | Show offline queue banner and controls              | `false` |
| `migrated-workflows` | `NEXT_PUBLIC_FEATURE_FLAG_MIGRATED_WORKFLOWS` | Route staff to migrated analytics/reports/ops flows | `false` |

### Adding New Feature Flags

To add a new feature flag:

1. **Choose a descriptive name** using kebab-case (e.g., `advanced-search`)
2. **Add to environment files**:

   ```bash
   # .env.example
   NEXT_PUBLIC_FEATURE_FLAG_ADVANCED_SEARCH=false

   # .env.local
   NEXT_PUBLIC_FEATURE_FLAG_ADVANCED_SEARCH=true
   ```

3. **Use in your code**:

   ```tsx
   const { isEnabled } = useFeatureFlags();

   if (isEnabled("advanced-search")) {
     // Your new feature code
   }
   ```

4. **Document it** in this file's "Available Feature Flags" section

## Best Practices

### Naming Conventions

- Use **kebab-case** for flag names: `my-new-feature`
- Use **SCREAMING_SNAKE_CASE** for environment variables:
  `NEXT_PUBLIC_FEATURE_FLAG_MY_NEW_FEATURE`
- Be descriptive but concise
- Prefix with the feature area if needed: `payments-new-flow`, `ui-dark-mode`

### Implementation Guidelines

#### 1. Keep Flags Temporary

Feature flags are meant to be temporary. Once a feature is:

- Fully tested and validated
- Rolled out to all users
- Deemed stable

Remove the flag and make the feature permanent.

#### 2. Clean Up Old Flags

Regularly review and remove unused feature flags to prevent technical debt.

```bash
# Check for unused flags
pnpm run check:flags
```

#### 3. Default to Safe State

Always default flags to `false` (disabled) in production to prevent accidental
rollouts.

#### 4. Test Both States

Ensure your application works correctly with the feature both enabled and
disabled:

```tsx
describe("MyComponent", () => {
  it("renders correctly when feature is enabled", () => {
    // Test with flag enabled
  });

  it("renders correctly when feature is disabled", () => {
    // Test with flag disabled
  });
});
```

#### 5. Progressive Enhancement

Use feature flags for progressive enhancement, not breaking changes:

```tsx
function PaymentForm() {
  const { isEnabled } = useFeatureFlags();

  // Base functionality always works
  const handlePayment = () => {
    // Core payment logic
  };

  // Enhanced functionality when flag is enabled
  if (isEnabled("payment-validation-v2")) {
    return <EnhancedPaymentForm onSubmit={handlePayment} />;
  }

  return <StandardPaymentForm onSubmit={handlePayment} />;
}
```

## Advanced Usage

### Server-Side Flag Checks

While most feature flags are client-side, you can also check them server-side:

```tsx
// app/api/some-endpoint/route.ts
export async function GET() {
  const featureEnabled =
    process.env.NEXT_PUBLIC_FEATURE_FLAG_MY_FEATURE === "true";

  if (featureEnabled) {
    // New implementation
  } else {
    // Old implementation
  }
}
```

### Conditional Rendering

Use feature flags to conditionally render components:

```tsx
export function Dashboard() {
  const { isEnabled } = useFeatureFlags();

  return (
    <div>
      <Header />
      <MainContent />
      {isEnabled("analytics-dashboard") && <AnalyticsDashboard />}
      <Footer />
    </div>
  );
}
```

### Multiple Flag Conditions

Combine multiple flags for complex logic:

```tsx
export function AdvancedFeature() {
  const { isEnabled } = useFeatureFlags();

  const showAdvancedUI = isEnabled("new-ui") && isEnabled("beta-features");
  const showExperimentalSearch =
    isEnabled("advanced-search") && isEnabled("beta-features");

  return (
    <div>
      {showAdvancedUI && <NewUI />}
      {showExperimentalSearch && <ExperimentalSearch />}
    </div>
  );
}
```

## Monitoring and Analytics

### Tracking Flag Usage

Log feature flag usage for analytics:

```tsx
export function MyComponent() {
  const { isEnabled } = useFeatureFlags();
  const featureEnabled = isEnabled("new-feature");

  useEffect(() => {
    // Track which variant users see
    analytics.track("feature_flag_evaluation", {
      flag: "new-feature",
      enabled: featureEnabled,
    });
  }, [featureEnabled]);

  // Rest of component
}
```

### Performance Monitoring

Monitor performance differences between flag variants:

```tsx
export function PerformanceSensitiveComponent() {
  const { isEnabled } = useFeatureFlags();

  const startTime = performance.now();

  useEffect(() => {
    const endTime = performance.now();
    const duration = endTime - startTime;

    analytics.track("component_render_time", {
      component: "PerformanceSensitiveComponent",
      duration,
      flag_new_algorithm: isEnabled("new-algorithm"),
    });
  }, []);

  if (isEnabled("new-algorithm")) {
    return <OptimizedImplementation />;
  }

  return <StandardImplementation />;
}
```

## Testing

### Unit Tests

Test components with different flag states:

```tsx
import { render } from "@testing-library/react";
import { FeatureFlagProvider } from "@/components/FeatureFlagProvider";

describe("FeatureComponent", () => {
  it("shows new feature when enabled", () => {
    process.env.NEXT_PUBLIC_FEATURE_FLAG_NEW_FEATURE = "true";

    const { getByText } = render(
      <FeatureFlagProvider>
        <FeatureComponent />
      </FeatureFlagProvider>
    );

    expect(getByText("New Feature")).toBeInTheDocument();
  });

  it("shows old feature when disabled", () => {
    process.env.NEXT_PUBLIC_FEATURE_FLAG_NEW_FEATURE = "false";

    const { getByText } = render(
      <FeatureFlagProvider>
        <FeatureComponent />
      </FeatureFlagProvider>
    );

    expect(getByText("Old Feature")).toBeInTheDocument();
  });
});
```

### Integration Tests

Test full user flows with feature flags:

```tsx
describe("Payment Flow", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_FEATURE_FLAG_NEW_PAYMENT_FLOW = "true";
  });

  it("completes payment with new flow", async () => {
    // Test implementation
  });
});
```

## Rollout Strategy

### Phase 1: Development

- Enable flag in local `.env.local`
- Develop and test feature
- Ensure both flag states work correctly

### Phase 2: Staging

- Enable flag in staging environment
- Conduct thorough testing
- Gather feedback from team

### Phase 3: Production (Gradual Rollout)

- Start with flag disabled in production
- Enable for internal users first
- Gradually increase percentage of users
- Monitor metrics and feedback

### Phase 4: Full Rollout

- Enable flag for all users
- Monitor for issues
- Plan flag removal

### Phase 5: Cleanup

- Remove flag checks from code
- Make feature permanent
- Remove environment variables
- Update documentation

## Troubleshooting

### Flag Not Working

**Problem**: Feature flag changes not taking effect

**Solutions**:

1. Restart development server after changing `.env` files
2. Verify environment variable name starts with `NEXT_PUBLIC_`
3. Check flag name uses kebab-case (not snake_case)
4. Clear browser cache and reload
5. Verify FeatureFlagProvider is wrapping your component tree

### Flag Value Always False

**Problem**: Flag always returns false even when set to true

**Solutions**:

1. Check environment variable value is exactly "true" or "1"
2. Verify no typos in flag name
3. Check that `.env.local` file is in the correct directory
4. Ensure no conflicting environment variables in deployment

### Build-Time vs Runtime

**Problem**: Flag works in development but not in production build

**Solution**: Remember that environment variables are embedded at build time. If
you change them, you need to rebuild:

```bash
pnpm run build
```

## Migration Guide

### From Hard-Coded Conditionals

**Before**:

```tsx
const ENABLE_NEW_FEATURE = true;

function MyComponent() {
  if (ENABLE_NEW_FEATURE) {
    return <NewFeature />;
  }
  return <OldFeature />;
}
```

**After**:

```tsx
function MyComponent() {
  const { isEnabled } = useFeatureFlags();

  if (isEnabled("new-feature")) {
    return <NewFeature />;
  }
  return <OldFeature />;
}
```

## Security Considerations

1. **No Sensitive Data**: Never put sensitive information in feature flags
2. **Public Flags**: All `NEXT_PUBLIC_*` variables are visible to users
3. **Server-Side Flags**: Use regular environment variables (without
   `NEXT_PUBLIC_`) for server-only flags
4. **Audit Trail**: Log flag changes in production for audit purposes

## Future Enhancements

Potential improvements to the feature flag system:

- [ ] Remote flag management (e.g., LaunchDarkly, Split.io)
- [ ] User-specific flag overrides
- [ ] Percentage-based rollouts
- [ ] Time-based flag activation
- [ ] Dashboard for flag management
- [ ] Automatic flag cleanup detection

## References

- [React Context API](https://react.dev/reference/react/useContext)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Feature Toggle Best Practices](https://martinfowler.com/articles/feature-toggles.html)

## Support

For questions or issues with feature flags, please contact the development team
or create an issue in the repository.
