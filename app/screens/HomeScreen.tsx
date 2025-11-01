import type { ReactNode } from "react";
import { useMemo } from "react";

import { Button, GlassCard, GradientHeader, cn } from "@ibimina/ui";
import { ArrowRight, PiggyBank, Share2, Users } from "lucide-react";

type Navigation = {
  navigate: (route: string, params?: Record<string, unknown>) => void;
};

type GroupListItem = {
  id: string;
  name: string;
  code: string;
  members: number;
  totalBalance: number;
  nextContribution: string;
  sacco: string;
};

export interface HomeScreenProps {
  navigation: Navigation;
  groups?: GroupListItem[];
  headerActions?: ReactNode;
}

type FlatListRenderItemInfo<ItemT> = {
  item: ItemT;
  index: number;
};

interface FlatListProps<ItemT> {
  data: ItemT[];
  keyExtractor?: (item: ItemT, index: number) => string;
  renderItem: (info: FlatListRenderItemInfo<ItemT>) => ReactNode;
  ListEmptyComponent?: ReactNode;
  contentContainerClassName?: string;
}

function FlatList<ItemT>({
  data,
  keyExtractor,
  renderItem,
  ListEmptyComponent,
  contentContainerClassName,
}: FlatListProps<ItemT>) {
  if (!data.length) {
    return <>{ListEmptyComponent ?? null}</>;
  }

  return (
    <div className={cn("flex flex-col gap-4", contentContainerClassName)}>
      {data.map((item, index) => {
        const key = keyExtractor ? keyExtractor(item, index) : index.toString();
        return (
          <div key={key} className="group/flatlist-item">
            {renderItem({ item, index })}
          </div>
        );
      })}
    </div>
  );
}

interface GroupCardProps {
  group: GroupListItem;
  navigation: Navigation;
}

function GroupCard({ group, navigation }: GroupCardProps) {
  const handleNavigate = (route: string, params?: Record<string, unknown>) => () => {
    navigation.navigate(route, params);
  };

  return (
    <GlassCard
      title={group.name}
      subtitle={
        <span className="flex items-center gap-2 text-sm font-medium text-neutral-600">
          <Users className="h-4 w-4 text-atlas-blue" aria-hidden="true" />
          Code {group.code}
        </span>
      }
      actions={
        <Button
          variant="primary"
          size="sm"
          onClick={handleNavigate("GroupDetail", { id: group.id })}
          className="gap-2 bg-white text-atlas-blue hover:bg-atlas-blue/10 hover:text-atlas-blue"
        >
          View
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      }
      className="transition-transform duration-interactive hover:-translate-y-0.5"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
          <div className="flex flex-col">
            <span className="font-semibold text-neutral-500">Members</span>
            <span className="text-lg font-bold text-neutral-900">{group.members}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-neutral-500">Total Balance</span>
            <span className="text-lg font-bold text-atlas-blue">
              {new Intl.NumberFormat("rw-RW", {
                style: "currency",
                currency: "RWF",
                maximumFractionDigits: 0,
              }).format(group.totalBalance)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-neutral-500">Next Contribution</span>
            <span className="text-lg font-bold text-neutral-900">{group.nextContribution}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="gap-2 bg-atlas-blue text-white hover:bg-atlas-blue-dark"
            onClick={handleNavigate("Pay", { groupId: group.id })}
          >
            <PiggyBank className="h-3.5 w-3.5" aria-hidden="true" />
            Pay Contribution
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="gap-2 bg-neutral-100 text-neutral-900 hover:bg-neutral-200"
            onClick={handleNavigate("GroupShare", { groupId: group.id, code: group.code })}
          >
            <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
            Share Invite
          </Button>
        </div>

        <div className="rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
          <span className="font-semibold text-neutral-700">SACCO:</span> {group.sacco}
        </div>
      </div>
    </GlassCard>
  );
}

const FALLBACK_GROUPS: GroupListItem[] = [
  {
    id: "kg-biz",
    name: "Kigali Business Group",
    code: "KGL247",
    members: 18,
    totalBalance: 425_000,
    nextContribution: "Tue, 14 Jan",
    sacco: "Umurenge SACCO Kigali",
  },
  {
    id: "rbc-farm",
    name: "Nyamata Farmers Cooperative",
    code: "NYM552",
    members: 25,
    totalBalance: 612_000,
    nextContribution: "Fri, 17 Jan",
    sacco: "Umurenge SACCO Nyamata",
  },
  {
    id: "musanze-tech",
    name: "Musanze Tech Women",
    code: "MSN884",
    members: 16,
    totalBalance: 389_500,
    nextContribution: "Sat, 18 Jan",
    sacco: "Umurenge SACCO Musanze",
  },
];

export function HomeScreen({ navigation, groups, headerActions }: HomeScreenProps) {
  const resolvedGroups = useMemo(() => groups ?? FALLBACK_GROUPS, [groups]);

  return (
    <div className="flex flex-1 flex-col gap-6 bg-neutral-50 p-4 md:p-8">
      <GradientHeader
        title="Welcome back"
        subtitle="Track your savings groups and stay on top of contributions"
        className="shadow-atlas"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <GlassCard className="bg-white/20 text-white shadow-none backdrop-blur">
            <p className="text-sm text-white/80">Active groups</p>
            <p className="text-2xl font-semibold">{resolvedGroups.length}</p>
          </GlassCard>
          <GlassCard className="bg-white/20 text-white shadow-none backdrop-blur">
            <p className="text-sm text-white/80">Total balance</p>
            <p className="text-2xl font-semibold">
              {new Intl.NumberFormat("rw-RW", {
                style: "currency",
                currency: "RWF",
                maximumFractionDigits: 0,
              }).format(resolvedGroups.reduce((total, group) => total + group.totalBalance, 0))}
            </p>
          </GlassCard>
          <GlassCard className="bg-white/20 text-white shadow-none backdrop-blur">
            <p className="text-sm text-white/80">Next contribution</p>
            <p className="text-2xl font-semibold">{resolvedGroups[0]?.nextContribution ?? "—"}</p>
          </GlassCard>
        </div>
      </GradientHeader>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">My Groups</h2>
        {headerActions}
      </div>

      <FlatList
        data={resolvedGroups}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-5"
        renderItem={({ item }) => <GroupCard group={item} navigation={navigation} />}
        ListEmptyComponent={
          <GlassCard title="No groups yet" subtitle="Join or create a group to get started">
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-neutral-600">
                Tap the button below to browse available savings groups in your SACCO.
              </p>
              <Button
                variant="primary"
                onClick={() => navigation.navigate("BrowseGroups")}
                className="bg-atlas-blue text-white hover:bg-atlas-blue-dark"
              >
                Browse groups
              </Button>
            </div>
          </GlassCard>
        }
      />
    </div>
  );
}

export default HomeScreen;
