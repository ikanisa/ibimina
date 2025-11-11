"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/*
 * First-login password reset temporarily disabled.
 *
 * import { useState, useTransition } from "react";
 * import { getSupabaseBrowserClient } from "@/lib/supabase/client";
 * import { useRouter, useSearchParams } from "next/navigation";
 * ...
 */

export default function FirstLoginResetPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
  return null;
}
