import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminUsers from "./pages/AdminUsers";
import Profile from "./pages/Profile";
import Ibimina from "./pages/Ibimina";
import IkiminaDetail from "./pages/IkiminaDetail";
import Reconciliation from "./pages/Reconciliation";
import Reports from "./pages/Reports";
import AuditLogs from "./pages/AuditLogs";
import NotFound from "./pages/NotFound";
import Executive from "./pages/Executive";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ibimina" element={<Ibimina />} />
          <Route path="/ibimina/:id" element={<IkiminaDetail />} />
          <Route path="/reconciliation" element={<Reconciliation />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/executive" element={<Executive />} />
          <Route path="/admin/audit" element={<AuditLogs />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/profile" element={<Profile />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
