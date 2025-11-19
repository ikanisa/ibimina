"use client";

import { Fragment } from "react";
import type { ProfileRow } from "@/lib/auth";

export const AppShellHero: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Fragment>{children}</Fragment>
);

export function AppShell({ children }: { children: React.ReactNode; profile: ProfileRow }) {
  return <>{children}</>;
}
