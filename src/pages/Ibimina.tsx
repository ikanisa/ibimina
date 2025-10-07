import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useUserProfile } from "@/hooks/use-user-profile";
import { IkiminaForm, IkiminaFormValues } from "@/components/ibimina/IkiminaForm";
import { Plus, RefreshCcw, Users } from "lucide-react";
import { toast } from "sonner";

interface IkiminaRecord {
  id: string;
  name: string;
  code: string;
  status: string;
  type: string;
  created_at: string | null;
  settings_json: any;
  members_count: number;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  PAUSED: "secondary",
  CLOSED: "outline",
};

const typeLabel: Record<string, string> = {
  ROSCA: "ROSCA",
  ASCA: "ASCA",
  HYBRID: "Hybrid",
};

const formatSettings = (settings: any) => {
  if (!settings?.contribution) return "—";
  const amount = settings.contribution.fixedAmount ?? 0;
  const frequency = settings.contribution.frequency ?? "MONTHLY";
  return `${new Intl.NumberFormat("rw-RW", { style: "currency", currency: "RWF", minimumFractionDigits: 0 }).format(amount)} · ${frequency.toLowerCase()}`;
};

const Ibimina = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<IkiminaRecord | null>(null);

  const { data: groups, isLoading, refetch } = useQuery({
    queryKey: ["ibimina", profile?.sacco_id],
    enabled: Boolean(profile?.sacco_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ibimina")
        .select("*, ikimina_members(count)")
        .eq("sacco_id", profile?.sacco_id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        toast.error("Failed to load ibimina");
        throw error;
      }

      return (data ?? []).map((item: any) => ({
        ...item,
        members_count: item.ikimina_members?.[0]?.count ?? 0,
      })) as IkiminaRecord[];
    },
  });

  const filteredGroups = useMemo(() => {
    if (!groups?.length) return [];
    return groups.filter((group) => {
      const term = search.toLowerCase();
      return (
        group.name.toLowerCase().includes(term) ||
        group.code.toLowerCase().includes(term)
      );
    });
  }, [groups, search]);

  const prepareFormDefaults = (record: IkiminaRecord | null): Partial<IkiminaFormValues> => {
    if (!record) return {};
    return {
      name: record.name,
      code: record.code,
      status: record.status as IkiminaFormValues["status"],
      type: record.type as IkiminaFormValues["type"],
      contributionAmount: record.settings_json?.contribution?.fixedAmount ?? 0,
      frequency: record.settings_json?.contribution?.frequency ?? "MONTHLY",
      referenceGranularity: record.settings_json?.depositMapping?.granularity ?? "GROUP_MEMBER",
      autoAssignMissingMember: record.settings_json?.depositMapping?.autoAssignMissingMember ?? false,
    };
  };

  const handleRefetch = async () => {
    await refetch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <div className="h-1 bg-kigali w-full" />
      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Ibimina registry</h1>
            <p className="text-sm text-muted-foreground">
              Manage savings groups, adjust settings, and launch onboarding flows.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleRefetch} disabled={isLoading || profileLoading}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={() => setCreateOpen(true)} disabled={!profile?.sacco_id}>
              <Plus className="mr-2 h-4 w-4" />
              New Ikimina
            </Button>
          </div>
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Groups</CardTitle>
            <CardDescription>
              {profile?.saccos?.name ? `Showing ibimina for ${profile.saccos.name}` : "Select a SACCO to continue."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search by group name or code"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Separator />
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contribution</TableHead>
                    <TableHead className="text-right">Members</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroups.map((group) => (
                    <TableRow key={group.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{group.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Created {group.created_at ? new Date(group.created_at).toLocaleDateString() : "—"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{group.code}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{typeLabel[group.type] ?? group.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[group.status] ?? "outline"}>{group.status}</Badge>
                      </TableCell>
                      <TableCell>{formatSettings(group.settings_json)}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {group.members_count}
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/ibimina/${group.id}`)}>
                          View
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setEditRecord(group)}>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!filteredGroups.length && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                        {isLoading || profileLoading ? "Loading groups..." : "No ibimina found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create new ikimina</DialogTitle>
          </DialogHeader>
          {profile?.sacco_id ? (
            <IkiminaForm
              saccoId={profile.sacco_id}
              onCompleted={async () => {
                setCreateOpen(false);
                await refetch();
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Select a SACCO before creating ibimina.</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editRecord)} onOpenChange={(open) => !open && setEditRecord(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Update ikimina</DialogTitle>
          </DialogHeader>
          {editRecord && profile?.sacco_id && (
            <IkiminaForm
              saccoId={profile.sacco_id}
              ikiminaId={editRecord.id}
              initialData={prepareFormDefaults(editRecord)}
              onCompleted={async () => {
                setEditRecord(null);
                await refetch();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Ibimina;
