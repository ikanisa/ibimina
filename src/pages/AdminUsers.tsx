import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Mail, Shield } from "lucide-react";
import { toast } from "sonner";

const roleLabels: Record<Database["public"]["Enums"]["app_role"], string> = {
  SYSTEM_ADMIN: "System Admin",
  SACCO_MANAGER: "SACCO Manager",
  SACCO_STAFF: "SACCO Staff",
};

type ManagedUser = {
  id: string;
  email: string;
  role: Database["public"]["Enums"]["app_role"];
  sacco_id: string | null;
  created_at: string;
  saccos?: { name: string | null } | null;
};

type Sacco = {
  id: string;
  name: string;
  district: string;
  sector_code: string;
};

type InviteState = {
  email: string;
  role: Database["public"]["Enums"]["app_role"];
  saccoId: string;
  loading: boolean;
};

const AdminUsers = () => {
  const navigate = useNavigate();
  const [currentUserRole, setCurrentUserRole] = useState<Database["public"]["Enums"]["app_role"] | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [saccos, setSaccos] = useState<Sacco[]>([]);
  const [invite, setInvite] = useState<InviteState>({
    email: "",
    role: "SACCO_STAFF",
    saccoId: "",
    loading: false,
  });
  const [initialising, setInitialising] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        navigate("/auth");
        return;
      }

      const { data: profile, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", auth.user.id)
        .single();

      if (error) {
        console.error(error);
        toast.error("Unable to load your profile");
        navigate("/dashboard");
        return;
      }

      if (profile.role !== "SYSTEM_ADMIN") {
        toast.error("Administrator access required");
        navigate("/dashboard");
        return;
      }

      setCurrentUserRole(profile.role);
      await Promise.all([loadUsers(), loadSaccos()]);
      setInitialising(false);
    };

    bootstrap();
  }, [navigate]);

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, role, sacco_id, created_at, saccos(name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Failed to load users");
      return;
    }

    setUsers(data || []);
  };

  const loadSaccos = async () => {
    const { data, error } = await supabase
      .from("saccos")
      .select("id, name, district, sector_code")
      .order("name", { ascending: true });

    if (error) {
      console.error(error);
      toast.error("Failed to load SACCOs");
      return;
    }

    setSaccos(data || []);
  };

  const saccoOptions = useMemo(() => {
    return saccos.map((sacco) => ({
      label: `${sacco.name} (${sacco.sector_code})`,
      value: sacco.id,
    }));
  }, [saccos]);

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!invite.email) {
      toast.error("Email is required");
      return;
    }

    if (invite.role !== "SYSTEM_ADMIN" && !invite.saccoId) {
      toast.error("Please select a SACCO for this role");
      return;
    }

    try {
      setInvite((current) => ({ ...current, loading: true }));
      const payload = {
        email: invite.email,
        role: invite.role,
        saccoId: invite.role === "SYSTEM_ADMIN" ? null : invite.saccoId || null,
      };

      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: payload,
      });

      if (error) {
        console.error(error);
        throw new Error(error.message || "Failed to invite user");
      }

      await loadUsers();
      setInvite({ email: "", role: "SACCO_STAFF", saccoId: "", loading: false });
      toast.success(
        data?.temporaryPassword
          ? `Invitation sent. Temporary password: ${data.temporaryPassword}`
          : "Invitation sent successfully"
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to invite user");
      setInvite((current) => ({ ...current, loading: false }));
    }
  };

  if (initialising || !currentUserRole) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="h-1 w-full bg-kigali" />
      <main className="container mx-auto max-w-5xl space-y-8 px-4 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Administrator — User Management</h1>
            <p className="text-muted-foreground">
              Invite new SACCO staff members and manage their access permissions.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>Back to dashboard</Button>
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-rw-blue" />
              Invite a team member
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="invite-email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="staff@sacco.rw"
                    value={invite.email}
                    onChange={(event) =>
                      setInvite((current) => ({ ...current, email: event.target.value }))
                    }
                    required
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select
                  value={invite.role}
                  onValueChange={(value: Database["public"]["Enums"]["app_role"]) =>
                    setInvite((current) => ({ ...current, role: value }))
                  }
                >
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SYSTEM_ADMIN">System Administrator</SelectItem>
                    <SelectItem value="SACCO_MANAGER">SACCO Manager</SelectItem>
                    <SelectItem value="SACCO_STAFF">SACCO Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {invite.role !== "SYSTEM_ADMIN" && (
                <div className="space-y-2">
                  <Label htmlFor="invite-sacco">Assign SACCO</Label>
                  <Select
                    value={invite.saccoId}
                    onValueChange={(value) =>
                      setInvite((current) => ({ ...current, saccoId: value }))
                    }
                  >
                    <SelectTrigger id="invite-sacco">
                      <SelectValue placeholder="Select SACCO" />
                    </SelectTrigger>
                    <SelectContent>
                      {saccoOptions.map((sacco) => (
                        <SelectItem key={sacco.value} value={sacco.value}>
                          {sacco.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="md:col-span-2">
                <Button type="submit" disabled={invite.loading} className="w-full md:w-auto">
                  {invite.loading ? "Sending invitation..." : "Send invitation"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Existing users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border bg-background/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>SACCO</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{roleLabels[user.role]}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.role === "SYSTEM_ADMIN"
                          ? "All districts"
                          : user.saccos?.name || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleString()
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No users have been invited yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground">
              Invitations send a secure email allowing the recipient to activate their account and set a personal password. A
              temporary password is displayed once for emergency fallback — share it securely if required.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminUsers;
