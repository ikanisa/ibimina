"use client";

import dynamic from "next/dynamic";

const DynamicBottomNav = dynamic(
  () => import("./enhanced-bottom-nav").then((mod) => mod.BottomNav),
  { ssr: false, loading: () => null }
);

export function ClientBottomNav() {
  return <DynamicBottomNav />;
}
