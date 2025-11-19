import { PageLoadingState } from "@/components/ui/base/LoadingStates";

export default function RootLoading() {
  return (
    <PageLoadingState
      title="Loading SACCO+"
      description="Fetching your balances, groups, and shortcuts. This won’t take long."
    />
  );
}
