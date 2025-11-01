import type { ReactNode } from "react";
import { useMemo } from "react";

import { Button, GlassCard as Glass, GradientHeader } from "@ibimina/ui";
import {
  ArrowLeft,
  CalendarDays,
  PiggyBank,
  Share2,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

type Navigation = {
  navigate: (route: string, params?: Record<string, unknown>) => void;
  goBack?: () => void;
};

type Route = {
  params: {
    id: string;
  };
};

type Group = {
  id: string;
  name: string;
  code: string;
  sacco: string;
  members: number;
  contributionDay: string;
  totalBalance: number;
  insurance: string;
  referenceNumber: string;
};

export interface GroupScreenProps {
  navigation: Navigation;
  route: Route;
  actions?: ReactNode;
}

const GROUP_DATA: Group[] = [
  {
    id: "kg-biz",
    name: "Kigali Business Group",
    code: "KGL247",
    sacco: "Umurenge SACCO Kigali",
    members: 18,
    contributionDay: "Tuesday",
    totalBalance: 425_000,
    insurance: "Wallet Coverage (Tier 1)",
    referenceNumber: "REF-KGL-247-2025",
  },
  {
    id: "rbc-farm",
    name: "Nyamata Farmers Cooperative",
    code: "NYM552",
    sacco: "Umurenge SACCO Nyamata",
    members: 25,
    contributionDay: "Friday",
    totalBalance: 612_000,
    insurance: "Wallet Coverage (Tier 2)",
    referenceNumber: "REF-NYM-552-2025",
  },
  {
    id: "musanze-tech",
    name: "Musanze Tech Women",
    code: "MSN884",
    sacco: "Umurenge SACCO Musanze",
    members: 16,
    contributionDay: "Saturday",
    totalBalance: 389_500,
    insurance: "Wallet Coverage (Tier 1)",
    referenceNumber: "REF-MSN-884-2025",
  },
];

export function GroupScreen({ navigation, route, actions }: GroupScreenProps) {
  const group = useMemo(
    () => GROUP_DATA.find((item) => item.id === route.params.id),
    [route.params.id]
  );

  const handleNavigate = (routeName: string, params?: Record<string, unknown>) => () => {
    navigation.navigate(routeName, params);
  };

  if (!group) {
    return (
      <div className="flex flex-1 flex-col gap-6 bg-neutral-50 p-4 md:p-8">
        <GradientHeader title="Group not found" subtitle="Please select another group from Home" />
        <Glass>
          <div className="flex flex-col gap-3 text-sm text-neutral-600">
            <p>The requested group could not be found. It may have been archived or removed.</p>
            <Button
              variant="primary"
              onClick={() => navigation.navigate("Home")}
              className="bg-atlas-blue text-white hover:bg-atlas-blue-dark"
            >
              Go back home
            </Button>
          </div>
        </Glass>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 bg-neutral-50 p-4 md:p-8">
      <GradientHeader
        title={group.name}
        subtitle={`Code ${group.code} • ${group.sacco}`}
        className="shadow-atlas"
      >
        <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
          <span className="inline-flex items-center gap-2">
            <Users className="h-4 w-4" aria-hidden="true" />
            {group.members} members
          </span>
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Contributions every {group.contributionDay}
          </span>
        </div>
      </GradientHeader>

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          onClick={() => (navigation.goBack ? navigation.goBack() : navigation.navigate("Home"))}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </Button>
        {actions}
      </div>

      <Glass title="Group overview">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-neutral-50 p-4">
            <p className="text-sm font-semibold text-neutral-500">Members</p>
            <p className="mt-1 text-2xl font-bold text-neutral-900">{group.members}</p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-4">
            <p className="text-sm font-semibold text-neutral-500">Total balance</p>
            <p className="mt-1 text-2xl font-bold text-atlas-blue">
              {new Intl.NumberFormat("rw-RW", {
                style: "currency",
                currency: "RWF",
                maximumFractionDigits: 0,
              }).format(group.totalBalance)}
            </p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-4">
            <p className="text-sm font-semibold text-neutral-500">Contribution day</p>
            <p className="mt-1 text-2xl font-bold text-neutral-900">{group.contributionDay}</p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-4">
            <p className="text-sm font-semibold text-neutral-500">Insurance</p>
            <p className="mt-1 text-base font-semibold text-emerald-600">{group.insurance}</p>
          </div>
        </div>
      </Glass>

      <Glass
        title="Quick actions"
        subtitle="Manage group payments and member list"
        actions={
          <Button
            variant="primary"
            size="sm"
            className="bg-white text-atlas-blue hover:bg-atlas-blue/10 hover:text-atlas-blue"
            onClick={handleNavigate("GroupMembers", { id: group.id })}
          >
            View members
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            variant="primary"
            className="justify-start gap-3 bg-atlas-blue text-white hover:bg-atlas-blue-dark"
            onClick={handleNavigate("Pay", { groupId: group.id })}
          >
            <PiggyBank className="h-4 w-4" aria-hidden="true" />
            Pay contribution
          </Button>
          <Button
            variant="secondary"
            className="justify-start gap-3 bg-neutral-100 text-neutral-900 hover:bg-neutral-200"
            onClick={handleNavigate("Wallet", { groupId: group.id })}
          >
            <Wallet className="h-4 w-4" aria-hidden="true" />
            Open wallet
          </Button>
          <Button
            variant="secondary"
            className="justify-start gap-3 bg-neutral-100 text-neutral-900 hover:bg-neutral-200"
            onClick={handleNavigate("GroupShare", { groupId: group.id, code: group.code })}
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            Share invite link
          </Button>
          <Button
            variant="secondary"
            className="justify-start gap-3 bg-neutral-100 text-neutral-900 hover:bg-neutral-200"
            onClick={handleNavigate("GroupSecurity", { groupId: group.id })}
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Security settings
          </Button>
        </div>
      </Glass>

      <Glass title="Reference details" subtitle="Use this reference when paying with USSD">
        <div className="flex flex-col gap-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm">
          <div className="flex flex-col">
            <span className="text-neutral-500">Reference number</span>
            <span className="text-lg font-semibold text-neutral-900">{group.referenceNumber}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-neutral-500">Group code</span>
            <span className="text-lg font-semibold text-atlas-blue">{group.code}</span>
          </div>
          <Button
            variant="secondary"
            className="self-start bg-atlas-blue text-white hover:bg-atlas-blue-dark"
            onClick={handleNavigate("ShareReference", { groupId: group.id })}
          >
            Share reference
          </Button>
        </div>
      </Glass>
    </div>
  );
}

export default GroupScreen;
