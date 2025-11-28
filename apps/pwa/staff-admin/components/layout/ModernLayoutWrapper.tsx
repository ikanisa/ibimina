"use client";

import { Home, Users, FileText, BarChart3, Settings, Sparkles, Menu } from "lucide-react";
import { AdaptiveLayout, type NavItem, type MobileNavItem } from "@ibimina/ui";
import { FloatingAssistant } from "@ibimina/ui";
import { usePathname } from "next/navigation";

const navigation: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    path: "/staff",
  },
  {
    id: "members",
    label: "Members",
    icon: Users,
    path: "/member",
    children: [
      { label: "All Members", path: "/member" },
      { label: "Onboarding", path: "/member/onboarding" },
      { label: "Groups", path: "/ikimina" },
    ],
  },
  {
    id: "transactions",
    label: "Transactions",
    icon: FileText,
    path: "/transactions",
    children: [
      { label: "All Transactions", path: "/transactions" },
      { label: "Deposits", path: "/transactions/deposits" },
      { label: "Withdrawals", path: "/transactions/withdrawals" },
      { label: "Reconciliation", path: "/recon" },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    path: "/analytics",
  },
  {
    id: "ai",
    label: "AI Assistant",
    icon: Sparkles,
    path: "/ai",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/settings",
  },
];

const mobileNavigation: MobileNavItem[] = [
  { icon: Home, label: "Home", path: "/staff" },
  { icon: Users, label: "Members", path: "/member" },
  { icon: FileText, label: "Transactions", path: "/transactions" },
  { icon: Sparkles, label: "AI", path: "/ai" },
  { icon: Menu, label: "More", path: "/settings" },
];

interface ModernLayoutWrapperProps {
  children: React.ReactNode;
}

export function ModernLayoutWrapper({ children }: ModernLayoutWrapperProps) {
  const pathname = usePathname();

  return (
    <>
      <AdaptiveLayout
        navigation={navigation}
        mobileNavigation={mobileNavigation}
        logo={{
          icon: ({ className }) => (
            <div className={`w-8 h-8 rounded-lg bg-primary flex items-center justify-center ${className}`}>
              <span className="text-primary-foreground font-bold text-sm">I</span>
            </div>
          ),
          text: "Ibimina",
          href: "/staff",
        }}
        onSearch={() => {
          // Trigger command palette or search modal
          document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
        }}
        onCreate={() => {
          // Navigate to create page or open modal
          window.location.href = "/member/onboarding";
        }}
        header={
          <div className="h-14 border-b bg-background/95 backdrop-blur flex items-center px-6">
            <div className="flex-1">
              <h2 className="text-sm font-medium text-muted-foreground">
                {getPageTitle(pathname)}
              </h2>
            </div>
            {/* Add user menu, notifications, etc. here */}
          </div>
        }
      >
        {children}
      </AdaptiveLayout>

      {/* Global AI Assistant */}
      <FloatingAssistant
        defaultOpen={false}
        suggestions={[
          "Show me today's deposits",
          "Find member by phone",
          "Create a new group",
          "Generate monthly report",
        ]}
      />
    </>
  );
}

function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/member")) return "Members";
  if (pathname.startsWith("/ikimina")) return "Groups";
  if (pathname.startsWith("/transactions")) return "Transactions";
  if (pathname.startsWith("/recon")) return "Reconciliation";
  if (pathname.startsWith("/analytics")) return "Analytics";
  if (pathname.startsWith("/ai")) return "AI Assistant";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/staff")) return "Dashboard";
  return "Ibimina";
}
