import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Activity, BarChart3, Gauge, LineChart, Radio, RefreshCw, Sparkles, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis } from "recharts";

interface ForecastResponse {
  horizonDays: number;
  historical: { date: string; amount: number }[];
  forecast: { date: string; projected: number; lower: number; upper: number }[];
  growth: {
    weekOverWeek: number;
    monthOverMonth: number;
    trendScore: number;
    volatility: number;
  };
  risk: {
    ikiminaId: string;
    name: string;
    code: string;
    saccoName: string | null;
    members: number;
    trailingThirty: number;
    expectedThirty: number;
    contributionRatio: number;
    lastContribution: string | null;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
  }[];
  ingestionHealth: {
    backlog: number;
    failed: number;
    queued: number;
    lastReceivedAt: string | null;
    modemStatus: string;
    averageDelayMinutes: number;
  };
  automation: {
    pendingNotifications: number;
    nextScheduled: string | null;
  };
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("rw-RW", { style: "currency", currency: "RWF", minimumFractionDigits: 0 }).format(value);

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

const riskBadgeVariant = (level: "LOW" | "MEDIUM" | "HIGH") => {
  if (level === "HIGH") return "destructive" as const;
  if (level === "MEDIUM") return "secondary" as const;
  return "outline" as const;
};

const Executive = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useUserProfile();

  const { data, isLoading: analyticsLoading, refetch } = useQuery({
    queryKey: ["executive-analytics", profile?.sacco_id, profile?.role],
    enabled: Boolean(profile),
    queryFn: async (): Promise<ForecastResponse> => {
      const { data: payload, error } = await supabase.functions.invoke("analytics-forecast", {
        body: {
          saccoId: profile?.role === "SYSTEM_ADMIN" ? undefined : profile?.sacco_id,
          district: profile?.role === "SYSTEM_ADMIN" ? profile?.saccos?.district : undefined,
        },
      });

      if (error) {
        throw error;
      }

      return payload as ForecastResponse;
    },
  });

  const chartData = useMemo(() => {
    if (!data) return [] as { date: string; historical?: number; forecast?: number; lower?: number; upper?: number }[];
    const historicalPoints = data.historical.map((point) => ({ date: point.date, historical: point.amount }));
    const forecastPoints = data.forecast.map((point) => ({
      date: point.date,
      forecast: point.projected,
      lower: point.lower,
      upper: point.upper,
    }));
    return [...historicalPoints, ...forecastPoints];
  }, [data]);

  const healthLabel = useMemo(() => {
    switch (data?.ingestionHealth.modemStatus) {
      case "ONLINE":
        return { label: "Modem online", variant: "outline" as const };
      case "DEGRADED":
        return { label: "Signal degraded", variant: "secondary" as const };
      default:
        return { label: "Modem offline", variant: "destructive" as const };
    }
  }, [data?.ingestionHealth.modemStatus]);

  const runAutomation = async () => {
    const { error } = await supabase.functions.invoke("gsm-maintenance");
    if (error) {
      toast.error(error.message ?? "Automation run failed");
      return;
    }

    toast.success("Queued GSM retries and replayed pending SMS");
    await refetch();
  };

  if (isLoading || analyticsLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kivu">
        <div className="glass px-6 py-4 rounded-xl text-sm">Loading executive insights…</div>
      </div>
    );
  }

  if (profile.role === "SACCO_STAFF") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-kivu">
        <Card className="max-w-md text-center glass">
          <CardHeader>
            <CardTitle>Restricted</CardTitle>
            <CardDescription>Executive analytics are available to system administrators and SACCO managers only.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>Return to dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kivu">
        <Card className="glass text-center px-6 py-4">
          <CardHeader>
            <CardTitle>No analytics available</CardTitle>
            <CardDescription>Import deposits or sync SMS traffic to unlock executive forecasts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>Return to dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kivu pb-16">
      <header className="bg-ibisi text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="uppercase tracking-widest text-xs text-white/80">Executive overview</p>
              <h1 className="text-3xl font-semibold flex items-center gap-2">
                <Sparkles className="h-6 w-6" /> Strategic insights
              </h1>
              <p className="text-sm text-white/80 max-w-2xl mt-2">
                Forecast deposits, spot emerging risk across ibimina, and verify GSM automation health from a single command centre.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="bg-white/10 text-white border-white/40" onClick={() => navigate("/dashboard")}>
                Back to dashboard
              </Button>
              <Button variant="outline" className="bg-white/10 text-white border-white/40" onClick={() => navigate("/reports")}>
                Open reports
              </Button>
              <Button className="bg-white text-ink hover:bg-white/90" onClick={runAutomation}>
                <RefreshCw className="mr-2 h-4 w-4" /> Run GSM automation
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 -mt-12 space-y-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="glass glow-rwanda">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Trend score</CardTitle>
              <LineChart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{Math.round(data?.growth.trendScore ?? 0)}</div>
              <p className="text-xs text-muted-foreground">Composite signal blending weekly momentum and volatility</p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Week-over-week</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{formatPercent(data?.growth.weekOverWeek ?? 0)}</div>
              <p className="text-xs text-muted-foreground">Change across the last seven posted trading days</p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Month-over-month</CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{formatPercent(data?.growth.monthOverMonth ?? 0)}</div>
              <p className="text-xs text-muted-foreground">Comparison against the previous 30-day contribution window</p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Volatility</CardTitle>
              <Gauge className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{(Math.max((data?.growth.volatility ?? 0) * 100, 0)).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Residual variance of contributions trendline</p>
            </CardContent>
          </Card>
        </div>

        <Card className="glass">
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Forecast outlook</CardTitle>
              <CardDescription>Historical performance with forward projections and confidence bounds</CardDescription>
            </div>
            <Badge variant="outline">Horizon: {data?.horizonDays ?? 0} days</Badge>
          </CardHeader>
          <CardContent className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: 0, right: 0 }}>
                <defs>
                  <linearGradient id="historicalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00A1DE" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#00A1DE" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FAD201" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#FAD201" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted) / 0.6)" />
                <XAxis dataKey="date" tickFormatter={(value) => format(new Date(value), "dd MMM")} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => format(new Date(label), "dd MMM yyyy")}
                />
                <Area type="monotone" dataKey="historical" stroke="#00A1DE" fill="url(#historicalGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="forecast" stroke="#FAD201" fill="url(#forecastGradient)" strokeWidth={2} />
                <Line type="monotone" dataKey="forecast" stroke="#FAD201" strokeWidth={2.5} className="forecast-line" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>At-risk ibimina</CardTitle>
                <CardDescription>Flagged by trailing contribution performance and latency</CardDescription>
              </div>
              <Badge variant="outline">Top {data?.risk.length ?? 0}</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ikimina</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Last contribution</TableHead>
                    <TableHead>Trailing 30d</TableHead>
                    <TableHead>Gap</TableHead>
                    <TableHead className="text-right">Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.risk ?? []).map((row) => {
                    const gap = row.expectedThirty - row.trailingThirty;
                    return (
                      <TableRow key={row.ikiminaId}>
                        <TableCell>
                          <div className="font-medium">{row.name}</div>
                          <p className="text-xs text-muted-foreground">{row.code}{row.saccoName ? ` · ${row.saccoName}` : ""}</p>
                        </TableCell>
                        <TableCell>{row.members}</TableCell>
                        <TableCell>
                          {row.lastContribution
                            ? `${formatDistanceToNow(new Date(row.lastContribution), { addSuffix: true })}`
                            : "—"}
                        </TableCell>
                        <TableCell>{formatCurrency(row.trailingThirty)}</TableCell>
                        <TableCell className={gap > 0 ? "text-amber-600" : "text-emerald-600"}>
                          {gap > 0 ? `-${formatCurrency(gap)}` : `+${formatCurrency(Math.abs(gap))}`}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={riskBadgeVariant(row.riskLevel)}>{row.riskLevel}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!data?.risk?.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                        All monitored ibimina are currently within expected contribution thresholds.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle>GSM health</CardTitle>
                  <CardDescription>Realtime signal from modem ingestion</CardDescription>
                </div>
                <Badge variant={healthLabel.variant}>{healthLabel.label}</Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Backlog</span>
                  <span className="font-medium">{data?.ingestionHealth.backlog ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Queued retries</span>
                  <span className="font-medium">{data?.ingestionHealth.queued ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Failed parses</span>
                  <span className="font-medium text-amber-600">{data?.ingestionHealth.failed ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Average delay</span>
                  <span className="font-medium">{(data?.ingestionHealth.averageDelayMinutes ?? 0).toFixed(1)} min</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                  <span>Last SMS</span>
                  <span>
                    {data?.ingestionHealth.lastReceivedAt
                      ? format(new Date(data.ingestionHealth.lastReceivedAt), "dd MMM yyyy HH:mm")
                      : "No data"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle>Automation</CardTitle>
                  <CardDescription>Notification queue & scheduled reconciliations</CardDescription>
                </div>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pending notifications</span>
                  <span className="font-medium">{data?.automation.pendingNotifications ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Next scheduled</span>
                  <span className="font-medium">
                    {data?.automation.nextScheduled
                      ? format(new Date(data.automation.nextScheduled), "dd MMM yyyy HH:mm")
                      : "Not scheduled"}
                  </span>
                </div>
                <Button variant="outline" className="w-full" onClick={runAutomation}>
                  <Radio className="mr-2 h-4 w-4" /> Trigger replay now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Executive;
