import type { Metadata } from "next";
import Link from "next/link";
import { OfflineActions } from "./offline-actions";

import { OfflinePageClient } from "./offline-page-client";

export const metadata: Metadata = {
  title: "Offline - Ibimina",
  description: "You are currently offline",
};

export default function OfflinePage() {
  return <OfflinePageClient />;
}
