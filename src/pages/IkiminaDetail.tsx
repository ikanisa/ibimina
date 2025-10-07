import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ChevronLeft, FileText, ShieldAlert, Upload, Users, Download, Loader2 } from "lucide-react";
import { MemberImportWizard } from "@/components/ibimina/MemberImportWizard";
import { StatementImportDialog } from "@/components/ibimina/StatementImportDialog";
import { IkiminaForm, IkiminaFormValues } from "@/components/ibimina/IkiminaForm";
import { useOfflineQueue } from "@/context/OfflineQueueContext";

interface IkiminaDetailRecord {
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
  sacco_id: string;
  settings_json: any;
  created_at: string | null;
  saccos?: {
    id: string;
    name: string;
    district: string;
    sector_code: string;
  } | null;
}

interface MemberRecord {
  id: string;
  full_name: string;
  msisdn: string | null;
  msisdn_masked?: string | null;
  member_code: string | null;
  status: string;
  joined_at: string | null;
}

interface PaymentRecord {
  id: string;
  occurred_at: string;
  amount: number;
  currency: string;
  msisdn: string | null;
  msisdn_masked?: string | null;
  reference: string | null;
  status: string;
  txn_id: string;
  created_at: string | null;
  confidence: number | null;
  source_id: string | null;
  member_id: string | null;
}

const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  PAUSED: "secondary",
  CLOSED: "outline",
};

const paymentStatusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  POSTED: "default",
  SETTLED: "secondary",
  UNALLOCATED: "outline",
  PENDING: "outline",
  REJECTED: "destructive",
};

const IkiminaDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [memberImportOpen, setMemberImportOpen] = useState(false);
  const [statementImportOpen, setStatementImportOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const { queueSupabaseFunction, isOnline } = useOfflineQueue();
  const [statementExporting, setStatementExporting] = useState<false | "csv" | "pdf">(false);
  const statementRange = useMemo(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { start, end };
  }, []);

  const formatMasked = (value?: string | null, masked?: string | null) => masked ?? value ?? "••••";

  const { data: ikimina, isLoading: ikiminaLoading, refetch: refetchIkimina } = useQuery({
    queryKey: ["ikimina", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ibimina")
        .select("*, saccos(id, name, district, sector_code)")
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        throw error;
      }

      return data as IkiminaDetailRecord;
    },
  });

  const { data: members, refetch: refetchMembers } = useQuery({
    queryKey: ["ikimina-members", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ikimina_members")
        .select("*")
        .eq("ikimina_id", id)
        .order("full_name");

      if (error) {
        console.error(error);
        throw error;
      }

      return data as MemberRecord[];
    },
  });

  const { data: payments, refetch: refetchPayments } = useQuery({
    queryKey: ["ikimina-payments", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("ikimina_id", id)
        .order("occurred_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error(error);
        throw error;
      }

      return data as PaymentRecord[];
    },
  });

  const { data: exceptions, refetch: refetchExceptions } = useQuery({
    queryKey: ["ikimina-exceptions", id, ikimina?.code],
    enabled: Boolean(id && ikimina),
    queryFn: async () => {
      const orFilters = ikimina?.code
        ? `ikimina_id.eq.${id},and(status.eq.UNALLOCATED,reference.ilike.%${ikimina.code}%)`
        : `ikimina_id.eq.${id}`;

      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .or(orFilters)
        .order("occurred_at", { ascending: false });

      if (error) {
        console.error(error);
        throw error;
      }

      return (data as PaymentRecord[]).filter((payment) =>
        payment.status === "UNALLOCATED" || payment.status === "PENDING"
      );
    },
  });

  const memberOptions = useMemo(() => {
    return (members ?? []).map((member) => ({
      value: member.id,
      label: `${member.full_name} ${member.member_code ? `(${member.member_code})` : ""}`.trim(),
    }));
  }, [members]);

  const totalDeposits = useMemo(() => {
    return (payments ?? [])
      .filter((payment) => payment.status === "POSTED" || payment.status === "SETTLED")
      .reduce((sum, payment) => sum + payment.amount, 0);
  }, [payments]);

  const activeMembers = useMemo(() => (members ?? []).filter((member) => member.status === "ACTIVE").length, [members]);

  const unallocatedCount = useMemo(() => (exceptions ?? []).filter((payment) => payment.status === "UNALLOCATED").length, [exceptions]);

  const handleAssignDrawer = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setSelectedMemberId(payment.member_id ?? "");
    setAssignDrawerOpen(true);
  };

  const invokeSettlement = async (payload: Record<string, unknown>) => {
    try {
      if (!isOnline) {
        await queueSupabaseFunction("settle-payment", payload);
        toast.success("Action queued — it will sync once you are online");
        return { queued: true } as const;
      }

      const { error } = await supabase.functions.invoke("settle-payment", { body: payload });

      if (error) {
        throw error;
      }

      return { queued: false } as const;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const handleAssignAndPost = async () => {
    if (!selectedPayment || !ikimina) return;

    if (!selectedMemberId) {
      toast.error("Select a member to assign");
      return;
    }

    try {
      const result = await invokeSettlement({
        paymentId: selectedPayment.id,
        action: "ASSIGN",
        ikiminaId: ikimina.id,
        memberId: selectedMemberId,
        autoPost: true,
      });

      setAssignDrawerOpen(false);
      setSelectedPayment(null);

      if (!result.queued) {
        toast.success("Payment posted to member");
        await Promise.all([refetchPayments(), refetchExceptions()]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to assign payment");
    }
  };

  const handleSettle = async (paymentId: string) => {
    try {
      const result = await invokeSettlement({ paymentId, action: "SETTLE" });
      if (!result.queued) {
        toast.success("Payment settled");
        await Promise.all([refetchPayments(), refetchExceptions()]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to settle payment");
    }
  };

  const handleReject = async (paymentId: string) => {
    try {
      const result = await invokeSettlement({ paymentId, action: "REJECT" });
      if (!result.queued) {
        toast.success("Payment rejected");
        await Promise.all([refetchPayments(), refetchExceptions()]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject payment");
    }
  };

  const prepareFormDefaults = (): Partial<IkiminaFormValues> => {
    if (!ikimina) return {};
    return {
      name: ikimina.name,
      code: ikimina.code,
      status: ikimina.status as IkiminaFormValues["status"],
      type: ikimina.type as IkiminaFormValues["type"],
      contributionAmount: ikimina.settings_json?.contribution?.fixedAmount ?? 0,
      frequency: ikimina.settings_json?.contribution?.frequency ?? "MONTHLY",
      referenceGranularity: ikimina.settings_json?.depositMapping?.granularity ?? "GROUP_MEMBER",
      autoAssignMissingMember: ikimina.settings_json?.depositMapping?.autoAssignMissingMember ?? false,
    };
  };

  const handleStatementExport = async (format: "csv" | "pdf") => {
    if (!ikimina) return;

    try {
      setStatementExporting(format);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-statement`);
      url.searchParams.set("ikiminaId", ikimina.id);
      url.searchParams.set("start", statementRange.start.toISOString());
      url.searchParams.set("end", statementRange.end.toISOString());
      url.searchParams.set("format", format);

      const response = await fetch(url.toString(), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) {
        throw new Error("Failed to generate statement export");
      }

      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${ikimina.code}-statement-${formatRangeLabel(statementRange.start, statementRange.end)}.${format}`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success(`Statement downloaded (${format.toUpperCase()})`);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to export statement");
    } finally {
      setStatementExporting(false);
    }
  };

  if (ikiminaLoading || !ikimina) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-sm text-muted-foreground">Loading ikimina…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <div className="h-1 bg-kigali w-full" />
      <main className="container mx-auto px-4 py-8 space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="inline-flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        <Card className="glass">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-2xl">{ikimina.name}</CardTitle>
              <CardDescription>
                Code {ikimina.code} · {ikimina.type} · {ikimina.saccos?.name}
              </CardDescription>
              <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                <Badge variant={statusColor[ikimina.status] ?? "outline"}>{ikimina.status}</Badge>
                <Badge variant="outline">Created {ikimina.created_at ? format(new Date(ikimina.created_at), "dd MMM yyyy") : "—"}</Badge>
                <Badge variant="outline">Active members {activeMembers}</Badge>
                <Badge variant="outline">
                  Total posted {new Intl.NumberFormat("rw-RW", { style: "currency", currency: "RWF", minimumFractionDigits: 0 }).format(totalDeposits)}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => handleStatementExport("pdf")}
                disabled={Boolean(statementExporting)}
              >
                {statementExporting === "pdf" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Statement PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStatementExport("csv")}
                disabled={Boolean(statementExporting)}
              >
                {statementExporting === "csv" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Statement CSV
              </Button>
              <Button variant="outline" onClick={() => setStatementImportOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import statement
              </Button>
              <Button variant="outline" onClick={() => setMemberImportOpen(true)}>
                <Users className="mr-2 h-4 w-4" />
                Import members
              </Button>
              <Button onClick={() => setEditOpen(true)}>
                <FileText className="mr-2 h-4 w-4" />
                Edit settings
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="deposits">Deposits</TabsTrigger>
            <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="kpi-card">
                <CardHeader>
                  <CardTitle>Total posted</CardTitle>
                  <CardDescription>Deposits allocated to members</CardDescription>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {new Intl.NumberFormat("rw-RW", { style: "currency", currency: "RWF", minimumFractionDigits: 0 }).format(totalDeposits)}
                </CardContent>
              </Card>
              <Card className="kpi-card">
                <CardHeader>
                  <CardTitle>Active members</CardTitle>
                  <CardDescription>Currently contributing members</CardDescription>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{activeMembers}</CardContent>
              </Card>
              <Card className="kpi-card border-amber-200">
                <CardHeader>
                  <CardTitle>Unallocated deposits</CardTitle>
                  <CardDescription>Needs manual review</CardDescription>
                </CardHeader>
                <CardContent className="text-2xl font-semibold text-amber-600">{unallocatedCount}</CardContent>
              </Card>
            </div>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Recent deposits</CardTitle>
                <CardDescription>Latest reconciled entries for this ikimina</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Occurred</TableHead>
                      <TableHead>Txn ID</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(payments ?? []).slice(0, 10).map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{format(new Date(payment.occurred_at), "dd MMM yyyy HH:mm")}</TableCell>
                        <TableCell>{payment.txn_id}</TableCell>
                        <TableCell>{payment.reference ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={paymentStatusColor[payment.status] ?? "outline"}>{payment.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat("rw-RW", { style: "currency", currency: "RWF", minimumFractionDigits: 0 }).format(payment.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!payments?.length && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                          No deposits imported yet. Upload statements or GSM SMS to populate this list.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Members</h3>
                <p className="text-sm text-muted-foreground">Maintain the roster and codes used in MoMo references.</p>
              </div>
              <Button variant="outline" onClick={() => setMemberImportOpen(true)}>
                <Users className="mr-2 h-4 w-4" />
                Import members
              </Button>
            </div>
            <Card className="glass">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>MSISDN</TableHead>
                      <TableHead>Member code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(members ?? []).map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>{member.full_name}</TableCell>
                        <TableCell>{formatMasked(member.msisdn, member.msisdn_masked)}</TableCell>
                        <TableCell>{member.member_code ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={member.status === "ACTIVE" ? "default" : "secondary"}>{member.status}</Badge>
                        </TableCell>
                        <TableCell>{member.joined_at ? format(new Date(member.joined_at), "dd MMM yyyy") : "—"}</TableCell>
                      </TableRow>
                    ))}
                    {!members?.length && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                          No members imported yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deposits" className="space-y-4 pt-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle>All deposits</CardTitle>
                <CardDescription>History of imported statements and SMS transactions for this ikimina.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Occurred</TableHead>
                      <TableHead>Txn ID</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(payments ?? []).map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{format(new Date(payment.occurred_at), "dd MMM yyyy HH:mm")}</TableCell>
                        <TableCell>{payment.txn_id}</TableCell>
                        <TableCell>{payment.reference ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={paymentStatusColor[payment.status] ?? "outline"}>{payment.status}</Badge>
                        </TableCell>
                        <TableCell>{payment.confidence ? `${Math.round(payment.confidence * 100)}%` : "—"}</TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat("rw-RW", { style: "currency", currency: "RWF", minimumFractionDigits: 0 }).format(payment.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!payments?.length && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                          No deposits recorded.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reconciliation" className="space-y-4 pt-4">
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle>Exceptions & pending reviews</CardTitle>
                <CardDescription>Assign deposits that failed auto-matching and push them to the ledger.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Occurred</TableHead>
                      <TableHead>Txn ID</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>MSISDN</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(exceptions ?? []).map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{format(new Date(payment.occurred_at), "dd MMM yyyy HH:mm")}</TableCell>
                        <TableCell>{payment.txn_id}</TableCell>
                        <TableCell>{payment.reference ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={paymentStatusColor[payment.status] ?? "outline"}>{payment.status}</Badge>
                        </TableCell>
                        <TableCell>{formatMasked(payment.msisdn, payment.msisdn_masked)}</TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat("rw-RW", { style: "currency", currency: "RWF", minimumFractionDigits: 0 }).format(payment.amount)}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleAssignDrawer(payment)}>
                            Assign
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleReject(payment.id)}>
                            Reject
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleSettle(payment.id)}>
                            Settle
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!exceptions?.length && (
                      <TableRow>
                        <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                          No outstanding exceptions for this ikimina.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 pt-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Ikimina settings</CardTitle>
                <CardDescription>Overview of contribution rules and reference requirements.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold">Contribution</h4>
                  <p>{formatSettings(ikimina.settings_json)}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Deposit mapping</h4>
                  <p>
                    Pattern {ikimina.settings_json?.depositMapping?.referenceMask ?? "DISTRICT.SACCO.GROUP(.MEMBER)?"} · Granularity {ikimina.settings_json?.depositMapping?.granularity ?? "GROUP_MEMBER"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <MemberImportWizard
        open={memberImportOpen}
        onOpenChange={(open) => {
          setMemberImportOpen(open);
          if (!open) {
            refetchMembers();
          }
        }}
        ikiminaId={ikimina.id}
        onCompleted={() => refetchMembers()}
      />

      <StatementImportDialog
        open={statementImportOpen}
        onOpenChange={(open) => {
          setStatementImportOpen(open);
          if (!open) {
            refetchPayments();
            refetchExceptions();
          }
        }}
        saccoId={ikimina.sacco_id}
        ikiminaId={ikimina.id}
        onCompleted={async () => {
          await Promise.all([refetchPayments(), refetchExceptions(), refetchIkimina()]);
        }}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Update ikimina</DialogTitle>
          </DialogHeader>
          <IkiminaForm
            saccoId={ikimina.sacco_id}
            ikiminaId={ikimina.id}
            initialData={prepareFormDefaults()}
            onCompleted={async () => {
              setEditOpen(false);
              await refetchIkimina();
            }}
          />
        </DialogContent>
      </Dialog>

      <Drawer
        open={assignDrawerOpen}
        onOpenChange={(open) => {
          setAssignDrawerOpen(open);
          if (!open) {
            setSelectedPayment(null);
            setSelectedMemberId("");
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Assign deposit</DrawerTitle>
            <DrawerDescription>Map this payment to a group member and post it to the ledger.</DrawerDescription>
          </DrawerHeader>
          <div className="px-6 space-y-4">
            <div className="rounded-lg border p-4 bg-muted/40 space-y-2">
              <p className="text-sm font-medium">Txn {selectedPayment?.txn_id}</p>
              <p className="text-sm text-muted-foreground">
                {selectedPayment ? format(new Date(selectedPayment.occurred_at), "dd MMM yyyy HH:mm") : "—"}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedPayment ? new Intl.NumberFormat("rw-RW", { style: "currency", currency: "RWF", minimumFractionDigits: 0 }).format(selectedPayment.amount) : "—"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="member">Assign to member</Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger id="member">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {memberOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={handleAssignAndPost}>
              <ShieldAlert className="mr-2 h-4 w-4" />
              Assign & post
            </Button>
            <Button variant="outline" onClick={() => setAssignDrawerOpen(false)}>Cancel</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

const formatSettings = (settings: any) => {
  if (!settings?.contribution) return "—";
  const amount = settings.contribution.fixedAmount ?? 0;
  const frequency = settings.contribution.frequency ?? "MONTHLY";
  return `${new Intl.NumberFormat("rw-RW", { style: "currency", currency: "RWF", minimumFractionDigits: 0 }).format(amount)} · ${frequency.toLowerCase()}`;
};

export default IkiminaDetail;

const formatRangeLabel = (start: Date, end: Date) => `${format(start, "yyyyMMdd")}-${format(end, "yyyyMMdd")}`;
