import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Building2, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  LogOut,
  Plus,
  Search,
  FileText
} from "lucide-react";
import { Input } from "@/components/ui/input";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDeposits: 0,
    activeIbimina: 0,
    activeMembers: 0,
    unallocated: 0,
    exceptions: 0
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      setUser(user);

      // Fetch user profile
      const { data: profile } = await supabase
        .from("users")
        .select("*, saccos(*)")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
      }

      // Fetch stats
      await fetchStats(profile?.sacco_id);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (saccoId?: string) => {
    try {
      const { count: ibiminaCount } = await supabase
        .from("ibimina")
        .select("*", { count: "exact", head: true })
        .eq("status", "ACTIVE")
        .eq(saccoId ? "sacco_id" : "id", saccoId || "");

      const { count: membersCount } = await supabase
        .from("ikimina_members")
        .select("*", { count: "exact", head: true })
        .eq("status", "ACTIVE");

      const { count: unallocatedCount } = await supabase
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("status", "UNALLOCATED");

      const { count: exceptionsCount } = await supabase
        .from("sms_inbox")
        .select("*", { count: "exact", head: true })
        .eq("status", "FAILED");

      const { data: paymentsData } = await supabase
        .from("payments")
        .select("amount")
        .eq("status", "POSTED");

      const totalDeposits = paymentsData?.reduce((sum, p) => sum + p.amount, 0) || 0;

      setStats({
        totalDeposits,
        activeIbimina: ibiminaCount || 0,
        activeMembers: membersCount || 0,
        unallocated: unallocatedCount || 0,
        exceptions: exceptionsCount || 0
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      {/* Rwanda flag accent */}
      <div className="h-1 bg-kigali w-full" />

      {/* Header */}
      <header className="border-b glass-dark sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-kigali flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Umurenge SACCO</h1>
                <p className="text-sm text-muted-foreground">
                  {userProfile?.saccos?.name || "Ibimina Management"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-right mr-4">
                <p className="text-sm font-medium">{user?.email}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {userProfile?.role?.replace("_", " ").toLowerCase()}
                </p>
              </div>
              <Button variant="outline" size="icon" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Search bar */}
        <Card className="glass">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search by transaction ID, reference, phone number, group, or member..." 
                className="pl-10 h-12 text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="kpi-card hover-lift">
            <CardHeader className="pb-2">
              <CardDescription>Total Deposits</CardDescription>
              <CardTitle className="text-2xl">
                {new Intl.NumberFormat('rw-RW', {
                  style: 'currency',
                  currency: 'RWF',
                  minimumFractionDigits: 0
                }).format(stats.totalDeposits)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>This month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="kpi-card hover-lift">
            <CardHeader className="pb-2">
              <CardDescription>Active Ibimina</CardDescription>
              <CardTitle className="text-2xl">{stats.activeIbimina}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Savings groups
              </div>
            </CardContent>
          </Card>

          <Card className="kpi-card hover-lift">
            <CardHeader className="pb-2">
              <CardDescription>Active Members</CardDescription>
              <CardTitle className="text-2xl">{stats.activeMembers}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-1" />
                <span>Total participants</span>
              </div>
            </CardContent>
          </Card>

          <Card className="kpi-card hover-lift">
            <CardHeader className="pb-2">
              <CardDescription>Unallocated</CardDescription>
              <CardTitle className="text-2xl text-amber-600">{stats.unallocated}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Needs assignment
              </div>
            </CardContent>
          </Card>

          <Card className="kpi-card hover-lift border-destructive/20">
            <CardHeader className="pb-2">
              <CardDescription>Exceptions</CardDescription>
              <CardTitle className="text-2xl text-destructive">{stats.exceptions}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>Requires action</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and operations</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-auto flex flex-col items-center justify-center p-6 space-y-2">
              <Plus className="h-8 w-8" />
              <span className="text-base">Create Ikimina</span>
            </Button>
            <Button variant="outline" className="h-auto flex flex-col items-center justify-center p-6 space-y-2">
              <Users className="h-8 w-8" />
              <span className="text-base">Import Members</span>
            </Button>
            <Button variant="outline" className="h-auto flex flex-col items-center justify-center p-6 space-y-2">
              <FileText className="h-8 w-8" />
              <span className="text-base">Import Statement</span>
            </Button>
            <Button variant="outline" className="h-auto flex flex-col items-center justify-center p-6 space-y-2">
              <AlertCircle className="h-8 w-8" />
              <span className="text-base">View Exceptions</span>
            </Button>
          </CardContent>
        </Card>

        {/* Recent activity placeholder */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest deposits and transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              No recent activity. Import statements to see transactions here.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
