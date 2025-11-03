/**
 * Home Page Loading State
 * Automatically shown by Next.js during page transition
 * Implements P0 fix for H1.5: No loading indicators
 */

import { HomeSkeleton } from "@/components/ui/home-skeleton";

export default function HomeLoading() {
  return <HomeSkeleton />;
}
