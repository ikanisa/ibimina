import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { Filter, ShieldCheck } from "lucide-react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useOfflineQueue } from "@/context/OfflineQueueContext";

interface PaymentRow {
  id: string;
  occurred_at: string;
  amount: number;
  currency: string;
  msisdn: string | null;
  msisdn_masked?: string | null;
  reference: string | null;
  status: string;
  txn_id: string;
  confidence: number | null;
  ikimina_id: string | null;
  member_id: string | null;
  ikimina?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface SmsRow {
  id: string;
  raw_text: string;
  received_at: string;
  status: string;
  confidence: number | null;
  parse_source: string | null;
  sacco_id: string | null;
}

interface IkiminaOption {
  id: string;
  name: string;
  code: string;
}

interface MemberOption {
  id: string;
  full_name: string;
  member_code: string | null;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  UNALLOCATED: "outline",
  PENDING: "secondary",
  POSTED: "default",
  REJECTED: "destructive",
  PROCESSING: "secondary",
  QUEUED: "secondary",
};

const Reconciliation = () => {
  const navigate = useNavigate();
  const { data: profile } = useUserProfile();
  const { queueSupabaseFunction, isOnline } = useOfflineQueue();
  const [search, setSearch] = useState("");
  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(null);
  const [selectedIkimina, setSelectedIkimina] = useState<string>("");
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]);

  const { data: ibimina } = useQuery({
    queryKey: ["recon-ibimina", profile?.sacco_id],
    enabled: Boolean(profile?.sacco_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ibimina")
        .select("id, name, code")
        .eq("sacco_id", profile?.sacco_id)
        .order("name");

      if (error) {
        console.error(error);
        throw error;
      }

      return data as IkiminaOption[];
    },
  });

  const { data: payments, refetch: refetchPayments } = useQuery({
    queryKey: ["recon-payments", profile?.sacco_id],
    enabled: Boolean(profile?.sacco_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, ikimina:ibimina(id, name, code)")
        .eq("sacco_id", profile?.sacco_id)
        .in("status", ["UNALLOCATED", "PENDING"])
        .order("occurred_at", { ascending: false });

      if (error) {
        console.error(error);
        throw error;
      }

      return data as PaymentRow[];
    },
  });

  const { data: sms, refetch: refetchSms } = useQuery({
    queryKey: ["recon-sms", profile?.sacco_id],
    enabled: Boolean(profile?.sacco_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sms_inbox")
        .select("*")
        .eq("sacco_id", profile?.sacco_id)
        .in("status", ["FAILED", "PARSED", "PROCESSING", "QUEUED"])
        .order("received_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error(error);
        throw error;
      }

      return data as SmsRow[];
    },
  });

  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    const term = search.toLowerCase();
      return payments.filter((payment) => {
        if (!term) return true;
        const msisdn = (payment.msisdn_masked ?? payment.msisdn ?? "").toLowerCase();
        return (
          payment.txn_id.toLowerCase().includes(term) ||
          payment.reference?.toLowerCase().includes(term) ||
          msisdn.includes(term)
        );
      });
  }, [payments, search]);

  const exceptionCount = payments?.length ?? 0;
  const smsNeedingReview = (sms ?? []).filter((message) =>
    ["FAILED", "PROCESSING", "QUEUED"].includes(message.status) || (message.confidence ?? 1) < 0.9,
  );

  useEffect(() => {
    const loadMembers = async () => {
      if (!selectedIkimina) {
        setMemberOptions([]);
        return;
      }

      const { data, error } = await supabase
        .from("ikimina_members")
        .select("id, full_name, member_code")
        .eq("ikimina_id", selectedIkimina)
        .order("full_name");

      if (error) {
        console.error(error);
        toast.error("Failed to load members");
        return;
      }

      setMemberOptions(data as MemberOption[]);
    };

    loadMembers();
  }, [selectedIkimina]);

  const openAssignDrawer = (payment: PaymentRow) => {
    setSelectedPayment(payment);
    setSelectedIkimina(payment.ikimina_id ?? "");
    setSelectedMember(payment.member_id ?? "");
    setAssignDrawerOpen(true);
  };

  const invokeSettlement = async (payload: Record<string, unknown>) => {
    try {
      if (!isOnline) {
        await queueSupabaseFunction("settle-payment", { ...payload, actorId: profile?.id });
        toast.success("Action queued — it will sync when back online");
        return { queued: true } as const;
      }

      const { error } = await supabase.functions.invoke("settle-payment", { body: { ...payload, actorId: profile?.id } });

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
    if (!selectedPayment) return;

    if (!selectedIkimina || !selectedMember) {
      toast.error("Select ikimina and member");
      return;
    }

    try {
      const result = await invokeSettlement({
        paymentId: selectedPayment.id,
        action: "ASSIGN",
        ikiminaId: selectedIkimina,
        memberId: selectedMember,
        autoPost: true,
      });

      setAssignDrawerOpen(false);
      setSelectedPayment(null);

      if (!result.queued) {
        toast.success("Payment assigned and posted");
        await refetchPayments();
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
        await refetchPayments();
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
        await refetchPayments();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject payment");
    }
  };

  const handleSmsReview = async (smsId: string, action: "REPROCESS" | "FLAG") => {
    try {
      const { data, error } = await supabase.functions.invoke("sms-review", {
        body: { smsId, action, actorId: profile?.id },
      });

      if (error) {
        throw error;
      }

      toast.success(
        action === "REPROCESS" ? "SMS reprocessed" : "SMS flagged for follow-up",
      );

      await refetchSms();
      if (action === "REPROCESS" && data?.status === "PARSED") {
        await refetchPayments();
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to review SMS");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <div className="h-1 bg-kigali w-full" />
      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Reconciliation</h1>
            <p className="text-sm text-muted-foreground">
              Resolve unallocated deposits, review low-confidence SMS, and push approved entries to the ledger.
            </p>
            {!isOnline && (
              <p className="text-xs text-amber-500 mt-1">Offline mode — approvals will queue until connectivity returns.</p>
            )}
          </div>
          <Button variant="outline" onClick={() => { refetchPayments(); refetchSms(); }}>
            <Filter className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>

        <Tabs defaultValue="payments">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payments">Payments ({exceptionCount})</TabsTrigger>
            <TabsTrigger value="sms">SMS ({smsNeedingReview.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-4 pt-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Pending assignments</CardTitle>
                <CardDescription>Assign deposits to ikimina and members or escalate to the originating team.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Search by transaction ID, reference, or MSISDN"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Occurred</TableHead>
                        <TableHead>Txn ID</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Ikimina</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>MSISDN</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{format(new Date(payment.occurred_at), "dd MMM yyyy HH:mm")}</TableCell>
                          <TableCell>{payment.txn_id}</TableCell>
                          <TableCell>{payment.reference ?? "—"}</TableCell>
                          <TableCell>{payment.ikimina?.name ?? "—"}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[payment.status] ?? "outline"}>{payment.status}</Badge>
                          </TableCell>
                          <TableCell>{payment.msisdn_masked ?? payment.msisdn ?? "••••"}</TableCell>
                          <TableCell className="text-right">
                            {new Intl.NumberFormat("rw-RW", { style: "currency", currency: "RWF", minimumFractionDigits: 0 }).format(payment.amount)}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button size="sm" variant="outline" onClick={() => openAssignDrawer(payment)}>
                              Assign
                            </Button>
                            {payment.ikimina_id && (
                              <Button size="sm" variant="outline" onClick={() => handleSettle(payment.id)}>
                                Settle
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => handleReject(payment.id)}>
                              Reject
                            </Button>
                            {payment.ikimina_id && (
                              <Button size="sm" variant="ghost" onClick={() => navigate(`/ibimina/${payment.ikimina_id}`)}>
                                View
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!filteredPayments.length && (
                        <TableRow>
                          <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                            No pending payments. Great work!
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sms" className="space-y-4 pt-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle>SMS needing attention</CardTitle>
                <CardDescription>Messages that failed parsing or fell below confidence thresholds.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Received</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Parse source</TableHead>
                      <TableHead>Preview</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {smsNeedingReview.map((message) => (
                      <TableRow key={message.id}>
                        <TableCell>{format(new Date(message.received_at), "dd MMM yyyy HH:mm")}</TableCell>
                        <TableCell>
                          <Badge variant={message.status === "FAILED" ? "destructive" : "outline"}>{message.status}</Badge>
                        </TableCell>
                        <TableCell>{message.confidence ? `${Math.round(message.confidence * 100)}%` : "—"}</TableCell>
                        <TableCell>{message.parse_source ?? "—"}</TableCell>
                        <TableCell className="max-w-xl whitespace-pre-wrap text-sm">{message.raw_text}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSmsReview(message.id, "REPROCESS")}
                          >
                            Re-run
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSmsReview(message.id, "FLAG")}
                          >
                            Flag
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!smsNeedingReview.length && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                          All SMS have been parsed successfully.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Drawer
        open={assignDrawerOpen}
        onOpenChange={(open) => {
          setAssignDrawerOpen(open);
          if (!open) {
            setSelectedPayment(null);
            setSelectedIkimina("");
            setSelectedMember("");
            setMemberOptions([]);
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Assign payment</DrawerTitle>
            <DrawerDescription>Select an ikimina and member to post this deposit.</DrawerDescription>
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
              <Label htmlFor="ikimina">Ikimina</Label>
              <Select value={selectedIkimina} onValueChange={(value) => setSelectedIkimina(value)}>
                <SelectTrigger id="ikimina">
                  <SelectValue placeholder="Select ikimina" />
                </SelectTrigger>
                <SelectContent>
                  {ibimina?.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name} ({group.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="member">Member</Label>
              <Select value={selectedMember} onValueChange={(value) => setSelectedMember(value)}>
                <SelectTrigger id="member">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {memberOptions.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name} {member.member_code ? `(${member.member_code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={handleAssignAndPost}>
              <ShieldCheck className="mr-2 h-4 w-4" /> Assign & post
            </Button>
            <Button variant="outline" onClick={() => setAssignDrawerOpen(false)}>Cancel</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Reconciliation;
