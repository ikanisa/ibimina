import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeft, Shield } from "lucide-react";

interface AuditLogRow {
  id: string;
  actor_id: string;
  action: string;
  entity: string;
  entity_id: string;
  diff_json: Record<string, unknown> | null;
  created_at: string;
}

const AuditLogs = () => {
  const navigate = useNavigate();
  const { data: profile } = useUserProfile();
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  const { data: logs, refetch, isLoading } = useQuery({
    queryKey: ["audit-logs", entityFilter],
    enabled: profile?.role === "SYSTEM_ADMIN",
    queryFn: async (): Promise<AuditLogRow[]> => {
      const query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (entityFilter) {
        query.eq("entity", entityFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error(error);
        throw error;
      }

      return data as AuditLogRow[];
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to load audit logs");
    },
  });

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    const term = search.toLowerCase();
    if (!term) return logs;

    return logs.filter((log) =>
      [log.action, log.entity, log.entity_id].some((value) => value.toLowerCase().includes(term)),
    );
  }, [logs, search]);

  if (profile && profile.role !== "SYSTEM_ADMIN") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <Shield className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">You need system admin access to view audit logs.</p>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>Go back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <div className="h-1 bg-kigali w-full" />
      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Audit trail</h1>
            <p className="text-sm text-muted-foreground">Review every change captured across the platform.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/dashboard")}> 
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to dashboard
            </Button>
            <Button variant="outline" onClick={() => refetch()}>Refresh</Button>
          </div>
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Search by entity, action, or identifier. Limit 200 most recent entries.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Input
              placeholder="Search actions or IDs"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="max-w-sm"
            />
            <Input
              placeholder="Filter by entity (e.g., PAYMENT, IKIMINA)"
              value={entityFilter}
              onChange={(event) => setEntityFilter(event.target.value.toUpperCase())}
              className="max-w-xs"
            />
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Activity timeline</CardTitle>
            <CardDescription>
              {isLoading ? "Loading entries…" : `${filteredLogs.length} change${filteredLogs.length === 1 ? "" : "s"} visible`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{format(new Date(log.created_at), "dd MMM yyyy HH:mm")}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{log.entity}</div>
                        <div className="text-xs text-muted-foreground">{log.entity_id}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{log.actor_id}</TableCell>
                    <TableCell>
                      {log.diff_json ? (
                        <pre className="max-h-40 overflow-auto rounded bg-muted/40 p-2 text-xs text-left">
                          {JSON.stringify(log.diff_json, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-xs text-muted-foreground">No diff recorded</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredLogs.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      {isLoading ? "Loading…" : "No audit activity matches your filters."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AuditLogs;
