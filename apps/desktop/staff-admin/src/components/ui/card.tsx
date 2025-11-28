// Stub UI components - minimal implementations

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>{children}</div>;
}

export function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`backdrop-blur-lg bg-white/80 dark:bg-gray-800/80 rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 ${className}`}>{children}</div>;
}
