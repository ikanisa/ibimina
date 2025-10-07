import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import { CalendarIcon, Download, FileText, Loader2, TrendingUp } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOfflineQueue } from "@/context/OfflineQueueContext";

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
  recentPayments: { id: string; txn_id: string; reference: string | null; amount: number; occurred_at: string; status: string; ikimina?: { name?: string | null } | null }[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("rw-RW", { style: "currency", currency: "RWF", minimumFractionDigits: 0 }).format(amount);

const Reports = () => {
  const { data: profile } = useUserProfile();
  const { isOnline } = useOfflineQueue();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [selectedIkimina, setSelectedIkimina] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const [isStatementExporting, setIsStatementExporting] = useState(false);

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ["reporting-summary", profile?.sacco_id, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    enabled: Boolean(profile?.sacco_id && dateRange?.from && dateRange?.to),
    queryFn: async (): Promise<SummaryResponse> => {
      const { data, error } = await supabase.functions.invoke("reporting-summary", {
        body: {
          saccoId: profile?.role === "SYSTEM_ADMIN" ? undefined : profile?.sacco_id,
          startDate: dateRange?.from?.toISOString(),
          endDate: dateRange?.to?.toISOString(),
          district: profile?.role === "SYSTEM_ADMIN" ? profile?.saccos?.district : undefined,
        },
      });

      if (error) {
        throw error;
      }

      return data as SummaryResponse;
    },
  });

  const { data: ikiminaOptions } = useQuery({
    queryKey: ["reporting-ikimina", profile?.sacco_id],
    enabled: Boolean(profile?.sacco_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ibimina")
        .select("id, name, code")
        .eq("sacco_id", profile?.sacco_id)
        .order("name");

      if (error) {
        throw error;
      }

      return data as { id: string; name: string; code: string }[];
    },
  });

  useEffect(() => {
    refetchSummary();
  }, [dateRange?.from, dateRange?.to, refetchSummary]);

  const handleDownload = async (format: "csv" | "pdf") => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error("Select a reporting period first");
      return;
    }

    try {
      setIsExporting(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-report`);
      url.searchParams.set("start", dateRange.from.toISOString());
      url.searchParams.set("end", dateRange.to.toISOString());
      url.searchParams.set("format", format);

      if (profile?.role === "SYSTEM_ADMIN") {
        if (profile?.saccos?.district) {
          url.searchParams.set("district", profile.saccos.district);
        }
      } else if (profile?.sacco_id) {
        url.searchParams.set("saccoId", profile.sacco_id);
      }

      const response = await fetch(url.toString(), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) {
        throw new Error("Failed to generate export");
      }

      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `ibimina-report-${format}-${formatDateLabel(dateRange)}.${format}`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success(`Report downloaded (${format.toUpperCase()})`);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  const handleStatementDownload = async (format: "csv" | "pdf") => {
    if (!selectedIkimina) {
      toast.error("Select an ikimina");
      return;
    }

    if (!dateRange?.from || !dateRange?.to) {
      toast.error("Select a reporting period first");
      return;
    }

    try {
      setIsStatementExporting(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-statement`);
      url.searchParams.set("ikiminaId", selectedIkimina);
      url.searchParams.set("start", dateRange.from.toISOString());
      url.searchParams.set("end", dateRange.to.toISOString());
      url.searchParams.set("format", format);

      const response = await fetch(url.toString(), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) {
        throw new Error("Failed to generate statement");
      }

      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `ikimina-statement-${formatDateLabel(dateRange)}.${format}`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success(`Statement downloaded (${format.toUpperCase()})`);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to export statement");
    } finally {
      setIsStatementExporting(false);
    }
  };

  const periodTotals = useMemo(
    () => [
      { label: "Range total", value: summary?.totals.rangeDeposits ?? 0 },
      { label: "This month", value: summary?.totals.month ?? 0 },
      { label: "Last 7 days", value: summary?.totals.week ?? 0 },
      { label: "Today", value: summary?.totals.today ?? 0 },
    ],
    [summary?.totals],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <div className="h-1 bg-kigali w-full" />
      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Reports & Exports</h1>
            <p className="text-sm text-muted-foreground">
              Download SACCO summaries, top-performing ibimina, and per-group statements. Offline exports are queued until you reconnect.
            </p>
            {!isOnline && <Badge variant="outline" className="mt-2">Offline mode — exports will queue</Badge>}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start min-w-[260px]">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from && dateRange?.to
                  ? `${format(dateRange.from, "dd MMM yyyy")} → ${format(dateRange.to, "dd MMM yyyy")}`
                  : "Select period"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                initialFocus
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {periodTotals.map((item) => (
            <Card key={item.label} className="glass">
              <CardHeader className="pb-2">
                <CardDescription>{item.label}</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(item.value)}</CardTitle>
              </CardHeader>
            </Card>
          ))}
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardDescription>Active ibimina</CardDescription>
              <CardTitle className="text-2xl">{summary?.counts.activeIbimina ?? 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardDescription>Active members</CardDescription>
              <CardTitle className="text-2xl">{summary?.counts.activeMembers ?? 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass border-amber-200">
            <CardHeader className="pb-2">
              <CardDescription>Unallocated</CardDescription>
              <CardTitle className="text-2xl text-amber-600">{summary?.counts.unallocated ?? 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass border-destructive/30">
            <CardHeader className="pb-2">
              <CardDescription>Exceptions</CardDescription>
              <CardTitle className="text-2xl text-destructive">{summary?.counts.exceptions ?? 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card className="glass">
          <CardHeader className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Exports</CardTitle>
              <CardDescription>Generate SACCO-wide summaries and per-ikimina statements</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={isExporting} onClick={() => handleDownload("csv")}
                className="flex items-center gap-2">
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                CSV summary
              </Button>
              <Button onClick={() => handleDownload("pdf")} disabled={isExporting} className="flex items-center gap-2">
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                PDF summary
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[minmax(240px,320px)_1fr]">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Ikimina statement</label>
                <Select value={selectedIkimina} onValueChange={setSelectedIkimina}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ikimina" />
                  </SelectTrigger>
                  <SelectContent>
                    {(ikiminaOptions ?? []).map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name} ({option.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button variant="outline" disabled={isStatementExporting} onClick={() => handleStatementDownload("csv")}
                    className="flex-1">
                    {isStatementExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : "CSV"}
                  </Button>
                  <Button disabled={isStatementExporting} onClick={() => handleStatementDownload("pdf")} className="flex-1">
                    {isStatementExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : "PDF"}
                  </Button>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Top ibimina by deposits
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ikimina</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead className="text-right">Deposits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(summary?.topIkimina ?? []).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.code}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.amount)}</TableCell>
                      </TableRow>
                    ))}
                    {!summary?.topIkimina?.length && (
                      <TableRow>
                        <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                          No deposits recorded for this period.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Recent payments</CardTitle>
            <CardDescription>Latest posted transactions within the reporting window</CardDescription>
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
                    <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                      No recent payments within the selected range.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
      {summaryLoading && (
        <div className="fixed inset-0 bg-background/40 backdrop-blur-sm flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      )}
    </div>
  );
};

const formatDateLabel = (range: DateRange | undefined) => {
  if (!range?.from || !range?.to) return "report";
  return `${format(range.from, "yyyyMMdd")}-${format(range.to, "yyyyMMdd")}`;
};

export default Reports;
