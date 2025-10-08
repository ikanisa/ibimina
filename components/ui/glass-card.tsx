import { cn } from "@/lib/utils";

interface GlassCardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function GlassCard({ title, subtitle, actions, className, children }: GlassCardProps) {
  return (
    <section className={cn("glass rounded-3xl p-6", className)}>
      {(title || actions) && (
        <header className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && <h2 className="text-lg font-semibold text-neutral-0">{title}</h2>}
            {subtitle && <p className="text-sm text-neutral-2">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
