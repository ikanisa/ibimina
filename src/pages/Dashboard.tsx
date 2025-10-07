import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Building2, Users, TrendingUp, AlertCircle, LogOut, Plus, Search, FileText, Shield, UserCog, LineChart, Download, BellRing, ActivitySquare } from "lucide-react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useOfflineQueue } from "@/context/OfflineQueueContext";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { format } from "date-fns";

interface SummaryResponse {
  totals: {
    rangeDeposits: number;
    today: number;
    week: number;
    month: number;
  };
  counts: {
    activeIbimina: number;
    activeMembers: number;
    unallocated: number;
    exceptions: number;
  };
  contributionsByDay: { date: string; amount: number }[];
  topIkimina: { id: string; name: string; code: string; amount: number }[];
  recentPayments: { id: string; txn_id: string; reference: string | null; amount: number; occurred_at: string; status: string }[];
}

interface MetricRow {
  event: string;
  total: number;
  last_occurred: string | null;
}

interface KpiCard {
  title: string;
  value: number;
  description: string;
  icon: JSX.Element;
  highlight?: "amber" | "destructive";
  isCurrency?: boolean;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("rw-RW", { style: "currency", currency: "RWF", minimumFractionDigits: 0 }).format(amount);

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { queuedCount, isOnline } = useOfflineQueue();

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ["dashboard-summary", profile?.sacco_id],
    enabled: Boolean(profile?.sacco_id),
    queryFn: async (): Promise<SummaryResponse> => {
      const { data, error } = await supabase.functions.invoke("reporting-summary", {
        body: {
          saccoId: profile?.role === "SYSTEM_ADMIN" ? undefined : profile?.sacco_id,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
          district: profile?.role === "SYSTEM_ADMIN" ? profile?.saccos?.district : undefined,
        },
      });

      if (error) {
        throw error;
      }

      return data as SummaryResponse;
    },
  });

  const { data: metrics } = useQuery({
    queryKey: ["system-metrics"],
    enabled: profile?.role === "SYSTEM_ADMIN",
    queryFn: async (): Promise<MetricRow[]> => {
      const { data, error } = await supabase
        .from("system_metrics")
        .select("event, total, last_occurred")
        .order("event", { ascending: true });

      if (error) {
        throw error;
      }

      return data as MetricRow[];
    },
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  const contributions = useMemo(() => summary?.contributionsByDay ?? [], [summary?.contributionsByDay]);

  const metricMap = useMemo(() => {
    const map = new Map<string, MetricRow>();
    (metrics ?? []).forEach((row) => map.set(row.event, row));
    return map;
  }, [metrics]);

  const kpis = useMemo<KpiCard[]>(() => {
    const items: KpiCard[] = [
      {
        title: "Total deposits",
        value: summary?.totals.rangeDeposits ?? 0,
        description: "Last 30 days",
        icon: <TrendingUp className="h-4 w-4" />,
        isCurrency: true,
      },
      {
        title: "Active ibimina",
        value: summary?.counts.activeIbimina ?? 0,
        description: "Savings groups",
        icon: <Users className="h-4 w-4" />,
      },
      {
        title: "Active members",
        value: summary?.counts.activeMembers ?? 0,
        description: "Contributing participants",
        icon: <Users className="h-4 w-4" />,
      },
      {
        title: "Unallocated",
        value: summary?.counts.unallocated ?? 0,
        description: "Needs assignment",
        icon: <AlertCircle className="h-4 w-4" />,
        highlight: "amber",
      },
      {
        title: "Exceptions",
        value: summary?.counts.exceptions ?? 0,
        description: "Requiring review",
        icon: <AlertCircle className="h-4 w-4" />,
        highlight: "destructive",
      },
    ];

    if (profile?.role === "SYSTEM_ADMIN") {
      const flagged = metricMap.get("sms_flagged")?.total ?? 0;
      items.push({
        title: "SMS flagged",
        value: flagged,
        description: "Awaiting review",
        icon: <BellRing className="h-4 w-4" />,
        highlight: flagged > 0 ? "amber" : undefined,
      });
    }

    return items;
  }, [summary?.counts, summary?.totals, metricMap, profile?.role]);

  const observabilityStats = useMemo(() => {
    if (profile?.role !== "SYSTEM_ADMIN") return [] as { label: string; value: number; lastSeen?: string | null }[];

    return [
      {
        label: "Escalations queued",
        value: metricMap.get("recon_escalations")?.total ?? 0,
        lastSeen: metricMap.get("recon_escalations")?.last_occurred ?? null,
      },
      {
        label: "SMS reprocessed",
        value: metricMap.get("sms_reprocessed")?.total ?? 0,
        lastSeen: metricMap.get("sms_reprocessed")?.last_occurred ?? null,
      },
      {
        label: "Ledger actions",
        value: metricMap.get("payment_action")?.total ?? 0,
        lastSeen: metricMap.get("payment_action")?.last_occurred ?? null,
      },
    ];
  }, [metricMap, profile?.role]);

  if (profileLoading || summaryLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading dashboard…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <div className="h-1 bg-kigali w-full" />

      <header className="border-b glass-dark sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-kigali flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Umurenge SACCO</h1>
                <p className="text-sm text-muted-foreground">
                  {profile?.saccos?.name ?? "Ibimina Management"}
                </p>
                {!isOnline && <Badge variant="outline">Offline mode</Badge>}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {profile?.role !== "SACCO_STAFF" && (
                <Button variant="outline" className="hidden md:inline-flex gap-2" onClick={() => navigate("/executive")}>
                  <LineChart className="h-4 w-4" /> Executive insights
                </Button>
              )}
              {profile?.role === "SYSTEM_ADMIN" && (
                <Button variant="outline" className="hidden md:inline-flex gap-2" onClick={() => navigate("/admin/users")}>
                  <Shield className="h-4 w-4" /> Manage users
                </Button>
              )}
              {profile?.role === "SYSTEM_ADMIN" && (
                <Button variant="outline" className="hidden md:inline-flex gap-2" onClick={() => navigate("/admin/audit")}> 
                  <ActivitySquare className="h-4 w-4" /> Audit trail
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                className="md:hidden"
                onClick={() => navigate("/profile")}
              >
                <UserCog className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden md:inline-flex gap-2"
                onClick={() => navigate("/profile")}
              >
                <UserCog className="h-4 w-4" /> Security
              </Button>
              <div className="text-right mr-2">
                <p className="text-sm font-medium">{profile?.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{profile?.role?.replace("_", " ").toLowerCase()}</p>
                {queuedCount > 0 && (
                  <p className="text-xs text-amber-500">{queuedCount} action(s) queued</p>
                )}
              </div>
              <Button variant="outline" size="icon" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <Card className="glass">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Search by transaction ID, reference, phone number, group, or member…" className="pl-10 h-12 text-base" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {kpis.map((kpi) => (
            <Card
              key={kpi.title}
              className={`kpi-card hover-lift ${kpi.highlight === "amber" ? "border-amber-200" : ""} ${kpi.highlight === "destructive" ? "border-destructive/30" : ""}`}
            >
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  {kpi.icon}
                  {kpi.title}
                </CardDescription>
                <CardTitle className="text-2xl">
                  {kpi.isCurrency
                    ? formatCurrency(kpi.value)
                    : new Intl.NumberFormat("rw-RW", { maximumFractionDigits: 0 }).format(kpi.value)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{kpi.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {profile?.role === "SYSTEM_ADMIN" && (
          <Card className="glass">
            <CardHeader className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Operational telemetry</CardTitle>
                <CardDescription>Automation and alerting indicators across the platform.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/admin/audit")}>
                <ActivitySquare className="mr-2 h-4 w-4" /> Open audit trail
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              {observabilityStats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-border/40 bg-background/60 p-4">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-semibold mt-1">{new Intl.NumberFormat("rw-RW").format(stat.value)}</p>
                  {stat.lastSeen && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last seen {format(new Date(stat.lastSeen), "dd MMM yyyy HH:mm")}
                    </p>
                  )}
                </div>
              ))}
              {!observabilityStats.length && (
                <p className="text-sm text-muted-foreground">No telemetry available yet.</p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Card className="glass overflow-hidden">
            <CardHeader className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Deposit trend</CardTitle>
                <CardDescription>Daily posted deposits (RWF) — last 30 days</CardDescription>
              </div>
              <Button variant="outline" className="gap-2" onClick={() => navigate("/reports")}> 
                <LineChart className="h-4 w-4" /> Detailed reports
              </Button>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={contributions} margin={{ left: 0, right: 0 }}>
                  <defs>
                    <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00A1DE" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#00A1DE" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tickFormatter={(value) => format(new Date(value), "dd MMM")} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} labelFormatter={(label) => format(new Date(label), "dd MMM yyyy")} />
                  <Area type="monotone" dataKey="amount" stroke="#00A1DE" fill="url(#areaColor)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardHeader>
              <CardTitle>Quick exports</CardTitle>
              <CardDescription>Generate CSV/PDF summaries and statements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full gap-2" onClick={() => navigate("/reports")}> 
                <Download className="h-4 w-4" /> Open exports
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={() => navigate("/reconciliation")}> 
                <AlertCircle className="h-4 w-4" /> Resolve exceptions
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={() => refetchSummary()}>Refresh metrics</Button>
            </CardContent>
          </Card>
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Recent payments</CardTitle>
            <CardDescription>Latest posted transactions</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Occurred</TableHead>
                  <TableHead>Txn ID</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(summary?.recentPayments ?? []).map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{format(new Date(payment.occurred_at), "dd MMM yyyy HH:mm")}</TableCell>
                    <TableCell>{payment.txn_id}</TableCell>
                    <TableCell>{payment.reference ?? "—"}</TableCell>
                    <TableCell>{payment.status}</TableCell>
                    <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                  </TableRow>
                ))}
                {!summary?.recentPayments?.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      No recent payments. Import statements or sync SMS to populate this list.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Common workflows for the operations team</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-auto flex flex-col items-center justify-center p-6 space-y-2" onClick={() => navigate("/ibimina")}> 
              <Plus className="h-8 w-8" />
              <span className="text-base">Create ikimina</span>
            </Button>
            <Button variant="outline" className="h-auto flex flex-col items-center justify-center p-6 space-y-2" onClick={() => navigate("/ibimina")}> 
              <Users className="h-8 w-8" />
              <span className="text-base">Import members</span>
            </Button>
            <Button variant="outline" className="h-auto flex flex-col items-center justify-center p-6 space-y-2" onClick={() => navigate("/ibimina")}> 
              <FileText className="h-8 w-8" />
              <span className="text-base">Import statement</span>
            </Button>
            <Button variant="outline" className="h-auto flex flex-col items-center justify-center p-6 space-y-2" onClick={() => navigate("/reconciliation")}> 
              <AlertCircle className="h-8 w-8" />
              <span className="text-base">View exceptions</span>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
