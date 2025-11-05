import { CalendarDays, ChartBar, Users } from "lucide-react";

export const metadata = {
  title: "Dashboard | Ibimina Staff",
  description: "Overview of daily ibimina performance and tasks.",
};

export default function DashboardPage() {
  const cards = [
    {
      title: "Active groups",
      value: "42",
      change: "+6.1% vs last week",
      icon: Users,
    },
    {
      title: "Tasks due today",
      value: "8",
      change: "2 urgent",
      icon: CalendarDays,
    },
    {
      title: "Collection rate",
      value: "97.4%",
      change: "Maintained",
      icon: ChartBar,
    },
  ];

  return (
    <section className="grid gap-6" aria-labelledby="dashboard-heading">
      <header className="space-y-2">
        <h2 id="dashboard-heading" className="text-2xl font-semibold text-slate-900">
          Daily operations
        </h2>
        <p className="text-sm text-slate-600">
          Monitor reconciliation queues, outstanding approvals, and risk alerts in one place.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map(({ title, value, change, icon: Icon }) => (
          <article
            key={title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            aria-label={title}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
              </div>
              <span className="rounded-full bg-atlas-blue/10 p-3 text-atlas-blue">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-500">{change}</p>
          </article>
        ))}
      </div>

      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm text-slate-600">
        Offline-ready mode keeps essential workflows accessible even without connectivity. Recent
        submissions will sync automatically once you are back online.
      </div>
    </section>
  );
}
