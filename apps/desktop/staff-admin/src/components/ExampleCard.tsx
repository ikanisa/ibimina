import { useDesktopTokens } from '../../../../../src/design/use-desktop-tokens';

/**
 * Example Card Component using Desktop Design Tokens
 * 
 * Demonstrates:
 * - Theme-aware colors
 * - Consistent spacing
 * - Typography scale
 * - Shadow hierarchy
 * - Border radius
 */

interface CardProps {
  title: string;
  description: string;
  theme?: 'light' | 'dark';
  children?: React.ReactNode;
}

export function ExampleCard({ title, description, theme = 'light', children }: CardProps) {
  const tokens = useDesktopTokens(theme);

  return (
    <div
      style={{
        backgroundColor: tokens.colors.surface.base,
        color: tokens.colors.text.primary,
        padding: tokens.spacing[6],
        borderRadius: tokens.radius.lg,
        boxShadow: tokens.shadows.md,
        border: `1px solid ${tokens.colors.border.default}`,
        transition: `all ${tokens.transitions.normal}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = tokens.shadows.lg;
        e.currentTarget.style.borderColor = tokens.colors.border.hover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = tokens.shadows.md;
        e.currentTarget.style.borderColor = tokens.colors.border.default;
      }}
    >
      {/* Title - Using heading scale */}
      <h3
        style={{
          fontSize: tokens.typography.heading.h3.size,
          lineHeight: String(tokens.typography.heading.h3.lineHeight),
          fontWeight: tokens.typography.heading.h3.weight,
          marginBottom: tokens.spacing[2],
          color: tokens.colors.text.primary,
        }}
      >
        {title}
      </h3>

      {/* Description - Using body scale */}
      <p
        style={{
          fontSize: tokens.typography.body.md.size,
          lineHeight: String(tokens.typography.body.md.lineHeight),
          color: tokens.colors.text.secondary,
          marginBottom: tokens.spacing[4],
        }}
      >
        {description}
      </p>

      {/* Content area */}
      {children && (
        <div
          style={{
            padding: tokens.spacing[4],
            backgroundColor: tokens.colors.surface.elevated,
            borderRadius: tokens.radius.md,
            marginTop: tokens.spacing[4],
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Example using Tailwind classes with desktop tokens
 */
export function ExampleCardTailwind({ title, description, children }: CardProps) {
  return (
    <div className="group p-6 bg-surface-base-light dark:bg-surface-base-dark rounded-lg shadow-md border border-border-default hover:shadow-lg hover:border-border-hover transition-normal">
      {/* Title */}
      <h3 className="text-h3 mb-2 text-text-primary">
        {title}
      </h3>

      {/* Description */}
      <p className="text-body-md text-text-secondary mb-4">
        {description}
      </p>

      {/* Content area */}
      {children && (
        <div className="p-4 bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-md mt-4">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Example dashboard layout using desktop tokens
 */
export function ExampleDashboard() {
  const tokens = useDesktopTokens('light');

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: tokens.colors.surface.base,
        padding: tokens.spacing[8],
      }}
    >
      {/* Hero/Display text */}
      <h1
        style={{
          fontSize: tokens.typography.display.xl.size,
          lineHeight: String(tokens.typography.display.xl.lineHeight),
          fontWeight: tokens.typography.display.xl.weight,
          letterSpacing: tokens.typography.display.xl.tracking,
          color: tokens.colors.text.primary,
          marginBottom: tokens.spacing[2],
        }}
      >
        SACCO+ Dashboard
      </h1>

      <p
        style={{
          fontSize: tokens.typography.body.lg.size,
          lineHeight: String(tokens.typography.body.lg.lineHeight),
          color: tokens.colors.text.secondary,
          marginBottom: tokens.spacing[8],
        }}
      >
        Monitor and manage your cooperative financial operations
      </p>

      {/* Grid of cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: tokens.spacing[6],
        }}
      >
        <ExampleCard
          title="Total Deposits"
          description="Track all member deposits across groups"
        >
          <div
            style={{
              fontSize: tokens.typography.display.md.size,
              fontWeight: tokens.typography.display.md.weight,
              color: tokens.colors.primary[600],
            }}
          >
            RWF 12,450,000
          </div>
        </ExampleCard>

        <ExampleCard
          title="Active Groups"
          description="Currently operational savings groups"
        >
          <div
            style={{
              fontSize: tokens.typography.display.md.size,
              fontWeight: tokens.typography.display.md.weight,
              color: tokens.colors.accent[600],
            }}
          >
            47 Groups
          </div>
        </ExampleCard>

        <ExampleCard
          title="Members"
          description="Total registered SACCO members"
        >
          <div
            style={{
              fontSize: tokens.typography.display.md.size,
              fontWeight: tokens.typography.display.md.weight,
              color: tokens.colors.success,
            }}
          >
            1,234
          </div>
        </ExampleCard>
      </div>
    </div>
  );
}
