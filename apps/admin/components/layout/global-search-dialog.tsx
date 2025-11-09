"use client";

import Link from "next/link";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState, useId } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Loader2, Search, X } from "lucide-react";
import type { ProfileRow } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  SaccoSearchCombobox,
  type SaccoSearchResult,
} from "@/components/saccos/sacco-search-combobox";
import { useTranslation } from "@/providers/i18n-provider";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";
import {
  markTimeToFirstResult,
  startTimeToFirstResult,
  trackCommandPalette,
} from "@/src/instrumentation/ux";

let cachedSupabaseClient: ReturnType<typeof getSupabaseBrowserClient> | null = null;
let supabaseClientInitError: Error | null = null;

function resolveSupabaseClient() {
  if (cachedSupabaseClient || supabaseClientInitError) {
    return cachedSupabaseClient;
  }

  try {
    cachedSupabaseClient = getSupabaseBrowserClient();
  } catch (error) {
    const resolvedError = error instanceof Error ? error : new Error(String(error));
    supabaseClientInitError = resolvedError;
    console.error("global-search.supabase.init_failed", { message: resolvedError.message });
    cachedSupabaseClient = null;
  }

  return cachedSupabaseClient;
}

type SearchCacheEntry = {
  ikimina: IkiminaResult[];
  members: MemberResult[];
  payments: PaymentResult[];
  error?: string | null;
  membersError?: string | null;
  paymentsError?: string | null;
  timestamp: number;
};

const SEARCH_CACHE = new Map<string, SearchCacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 5;

type IkiminaResult = {
  id: string;
  name: string;
  code: string;
  status: string;
  saccoName: string | null;
};

type MemberResult = {
  id: string;
  fullName: string;
  memberCode: string | null;
  msisdn: string | null;
  ikiminaId: string | null;
  ikiminaName: string | null;
  badge?: Badge;
};

type PaymentResult = {
  id: string;
  amount: number;
  status: string;
  occurredAt: string;
  reference: string | null;
  ikiminaId: string | null;
  ikiminaName: string | null;
  memberId: string | null;
  memberName: string | null;
};

type Badge = {
  label: string;
  tone: "critical" | "info" | "success";
};

type NavTarget = {
  href: string;
  primary: string;
  secondary: string;
  badge?: Badge;
};

type QuickAction = {
  href: string;
  primary: string;
  secondary: string;
  description: string;
  secondaryDescription: string;
  badge?: Badge;
};

type QuickActionGroup = {
  id: string;
  title: string;
  subtitle?: string;
  actions: QuickAction[];
};

const BADGE_TONE_STYLES = {
  critical: "border-red-500/40 bg-red-500/15 text-red-200",
  info: "border-sky-500/40 bg-sky-500/15 text-sky-100",
  success: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200",
} as const;

interface GlobalSearchDialogProps {
  open: boolean;
  onClose: () => void;
  profile: ProfileRow;
  navItems: NavTarget[];
  quickActions: QuickActionGroup[];
}

function formatRelativeDate(value: string, formatter: Intl.DateTimeFormat) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) {
    return formatter.format(date);
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;

  return formatter.format(date);
}

function renderHighlighted(text: string, query: string): ReactNode {
  if (!query) return text;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  if (index === -1) return text;
  const before = text.slice(0, index);
  const match = text.slice(index, index + query.length);
  const after = text.slice(index + query.length);
  return (
    <span>
      {before}
      <mark className="rounded bg-white/20 px-1 text-neutral-0">{match}</mark>
      {after}
    </span>
  );
}

export function GlobalSearchDialog({
  open,
  onClose,
  profile,
  navItems,
  quickActions,
}: GlobalSearchDialogProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const supabase = useMemo(() => resolveSupabaseClient(), []);
  const [query, setQuery] = useState("");
  const [ikimina, setIkimina] = useState<IkiminaResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberResult[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [payments, setPayments] = useState<PaymentResult[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [selectedSacco, setSelectedSacco] = useState<SaccoSearchResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const toast = useToast();
  const toastShownRef = useRef(false);
  const [showRefreshBadge, setShowRefreshBadge] = useState(false);
  const refreshBadgeTimer = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshToastAt = useRef<number>(0);
  const focusRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const dialogTitleId = useId();
  const requestSequenceRef = useRef(0);
  const requestTokenRef = useRef<string | null>(null);
  const requestMarkedRef = useRef<Record<string, boolean>>({});
  const lastQueryLoggedRef = useRef<string>("");

  const beginResultTimers = useCallback((context: Record<string, unknown>) => {
    requestSequenceRef.current += 1;
    const token = `${requestSequenceRef.current}`;
    requestTokenRef.current = token;
    requestMarkedRef.current = {};
    const base = { ...context, requestToken: token } satisfies Record<string, unknown>;
    startTimeToFirstResult(`commandPalette.ikimina:${token}`, base);
    startTimeToFirstResult(`commandPalette.members:${token}`, base);
    startTimeToFirstResult(`commandPalette.payments:${token}`, base);
    return token;
  }, []);

  const markResultReady = useCallback(
    (category: "ikimina" | "members" | "payments", extra?: Record<string, unknown>) => {
      const token = requestTokenRef.current;
      if (!token || requestMarkedRef.current[category]) {
        return;
      }
      requestMarkedRef.current[category] = true;
      markTimeToFirstResult(`commandPalette.${category}:${token}`, {
        category,
        ...(extra ?? {}),
      });
    },
    []
  );

  const handleNavigate = useCallback(
    (type: string, detail: Record<string, unknown>) => {
      trackCommandPalette("navigate", {
        targetType: type,
        ...detail,
      });
      onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      trackCommandPalette("opened", {
        role: profile.role,
        saccoId: profile.sacco_id ?? null,
      });
    } else {
      trackCommandPalette("closed", {
        role: profile.role,
        saccoId: profile.sacco_id ?? null,
      });
    }
  }, [open, profile.role, profile.sacco_id]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setQuery("");
      setSelectedSacco(null);
      setError(null);
    });
    const timeout = window.setTimeout(() => {
      if (!cancelled) {
        inputRef.current?.focus();
      }
    }, 30);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const scheduleStateUpdate = (updater: () => void) => {
      queueMicrotask(() => {
        if (active) {
          updater();
        }
      });
    };

    const cacheKey = `${profile.role}-${profile.sacco_id ?? "all"}`;
    const cached = SEARCH_CACHE.get(cacheKey);
    const cacheFresh = cached ? Date.now() - cached.timestamp < CACHE_TTL_MS : false;
    beginResultTimers({
      role: profile.role,
      saccoId: profile.sacco_id ?? null,
      hasCache: Boolean(cached),
      cacheFresh,
    });

    if (!supabase) {
      const unavailableMessage = t(
        "search.console.supabaseUnavailable",
        "Search is unavailable because Supabase is not configured."
      );
      scheduleStateUpdate(() => {
        setIkimina([]);
        setMembers([]);
        setPayments([]);
        setError(unavailableMessage);
        setMembersError(unavailableMessage);
        setPaymentsError(unavailableMessage);
        setLoading(false);
        setMembersLoading(false);
        setPaymentsLoading(false);
        setLastSyncedAt(new Date());
      });
      SEARCH_CACHE.set(cacheKey, {
        ikimina: [],
        members: [],
        payments: [],
        error: unavailableMessage,
        membersError: unavailableMessage,
        paymentsError: unavailableMessage,
        timestamp: Date.now(),
      });
      markResultReady("ikimina", { source: "unavailable", resultCount: 0 });
      markResultReady("members", { source: "unavailable", resultCount: 0 });
      markResultReady("payments", { source: "unavailable", resultCount: 0 });
      trackCommandPalette("search_unavailable", {
        reason: "supabase_missing",
        role: profile.role,
      });
      return () => {
        active = false;
      };
    }

    if (cached) {
      scheduleStateUpdate(() => {
        setIkimina(cached.ikimina);
        setMembers(cached.members);
        setPayments(cached.payments);
        setError(cached.error ?? null);
        setMembersError(cached.membersError ?? null);
        setPaymentsError(cached.paymentsError ?? null);
        setLoading(false);
        setMembersLoading(false);
        setPaymentsLoading(false);
        setLastSyncedAt(new Date(cached.timestamp));
      });
      markResultReady("ikimina", {
        source: "cache",
        resultCount: cached.ikimina.length,
      });
      markResultReady("members", {
        source: "cache",
        resultCount: cached.members.length,
      });
      markResultReady("payments", {
        source: "cache",
        resultCount: cached.payments.length,
      });
      if (cacheFresh) {
        return () => {
          active = false;
        };
      }
      beginResultTimers({
        role: profile.role,
        saccoId: profile.sacco_id ?? null,
        source: "network",
      });
    } else {
      scheduleStateUpdate(() => {
        setLoading(true);
        setMembersLoading(true);
        setPaymentsLoading(true);
        setError(null);
        setMembersError(null);
        setPaymentsError(null);
        setIkimina([]);
        setMembers([]);
        setPayments([]);
      });
    }

    const fetchData = async () => {
      const baseLimit = profile.role === "SYSTEM_ADMIN" ? 400 : 200;
      let queryBuilder = supabase
        .from("ibimina")
        .select("id, name, code, status, saccos(name)")
        .order("updated_at", { ascending: false })
        .limit(baseLimit);

      if (profile.role !== "SYSTEM_ADMIN") {
        if (!profile.sacco_id) {
          if (!active) return;
          setIkimina([]);
          setLoading(false);
          setMembers([]);
          setMembersLoading(false);
          setMembersError("Assign yourself to a SACCO to search members.");
          setPayments([]);
          setPaymentsLoading(false);
          setPaymentsError("Assign yourself to a SACCO to search payments.");
          setError("Assign yourself to a SACCO to search.");
          SEARCH_CACHE.set(cacheKey, {
            ikimina: [],
            members: [],
            payments: [],
            error: "Assign yourself to a SACCO to search.",
            membersError: "Assign yourself to a SACCO to search members.",
            paymentsError: "Assign yourself to a SACCO to search payments.",
            timestamp: Date.now(),
          });
          setLastSyncedAt(new Date());
          markResultReady("ikimina", { source: "forbidden", resultCount: 0 });
          markResultReady("members", { source: "forbidden", resultCount: 0 });
          markResultReady("payments", { source: "forbidden", resultCount: 0 });
          trackCommandPalette("search_unavailable", {
            reason: "sacco_missing",
            role: profile.role,
          });
          return;
        }
        queryBuilder = queryBuilder.eq("sacco_id", profile.sacco_id);
      }

      const { data, error } = await queryBuilder;
      if (!active) return;

      if (error) {
        console.error(error);
        setError(error.message ?? "Failed to load ikimina");
        setIkimina([]);
        setLoading(false);
        setMembers([]);
        setMembersLoading(false);
        setMembersError("Search unavailable");
        setPayments([]);
        setPaymentsLoading(false);
        setPaymentsError("Search unavailable");
        SEARCH_CACHE.set(cacheKey, {
          ikimina: [],
          members: [],
          payments: [],
          error: error.message ?? "Failed to load ikimina",
          membersError: "Search unavailable",
          paymentsError: "Search unavailable",
          timestamp: Date.now(),
        });
        setLastSyncedAt(new Date());
        markResultReady("ikimina", { source: "network_error", resultCount: 0 });
        markResultReady("members", { source: "network_error", resultCount: 0 });
        markResultReady("payments", { source: "network_error", resultCount: 0 });
        trackCommandPalette("search_failed", {
          stage: "ikimina",
          message: error.message ?? "unknown",
        });
        return;
      }

      type IkiminaRow = {
        id: string;
        name: string;
        code: string | null;
        status: string;
        saccos: { name: string | null } | null;
      };

      const rows = ((data ?? []) as IkiminaRow[]).map((row) => ({
        id: row.id,
        name: row.name,
        code: row.code ?? "",
        status: row.status,
        saccoName: row.saccos?.name ?? null,
      }));

      setIkimina(rows);
      setLoading(false);
      markResultReady("ikimina", {
        source: "network",
        resultCount: rows.length,
      });

      const groupIds = rows.map((row) => row.id);
      if (groupIds.length === 0) {
        setMembers([]);
        setMembersLoading(false);
        setPayments([]);
        setPaymentsLoading(false);
        SEARCH_CACHE.set(cacheKey, {
          ikimina: rows,
          members: [],
          payments: [],
          error: null,
          membersError: null,
          paymentsError: null,
          timestamp: Date.now(),
        });
        setLastSyncedAt(new Date());
        markResultReady("members", {
          source: "network",
          resultCount: 0,
        });
        markResultReady("payments", {
          source: "network",
          resultCount: 0,
        });
        return;
      }

      const scopedIds =
        profile.role === "SYSTEM_ADMIN" ? groupIds.slice(0, 200) : groupIds.slice(0, 120);
      const memberLimit = profile.role === "SYSTEM_ADMIN" ? 250 : 140;
      const paymentLimit = profile.role === "SYSTEM_ADMIN" ? 160 : 90;

      const [membersRes, paymentsRes] = await Promise.all([
        supabase
          .from("ikimina_members_public")
          .select("id, full_name, member_code, msisdn, ikimina_id, ikimina_name")
          .in("ikimina_id", scopedIds)
          .order("joined_at", { ascending: false })
          .limit(memberLimit),
        supabase
          .from("payments")
          .select(
            "id, amount, status, occurred_at, reference, ikimina_id, member_id, group:ibimina(name)"
          )
          .in("ikimina_id", scopedIds)
          .order("occurred_at", { ascending: false })
          .limit(paymentLimit),
      ]);

      if (!active) return;

      let memberRows: MemberResult[] = [];
      if (membersRes.error) {
        console.error(membersRes.error);
        setMembers([]);
        setMembersError(membersRes.error.message ?? "Failed to load members");
        markResultReady("members", {
          source: "network_error",
          resultCount: 0,
        });
        trackCommandPalette("search_failed", {
          stage: "members",
          message: membersRes.error.message ?? "unknown",
        });
      } else {
        memberRows = (
          (membersRes.data ?? []) as Array<{
            id: string;
            full_name: string;
            member_code: string | null;
            msisdn: string | null;
            ikimina_id: string | null;
            ikimina_name: string | null;
          }>
        ).map((row) => ({
          id: row.id,
          fullName: row.full_name,
          memberCode: row.member_code,
          msisdn: row.msisdn,
          ikiminaId: row.ikimina_id,
          ikiminaName: row.ikimina_name ?? null,
        }));
        setMembers(memberRows);
        setMembersError(null);
        markResultReady("members", {
          source: "network",
          resultCount: memberRows.length,
        });
      }
      setMembersLoading(false);

      const memberNameMap = new Map(memberRows.map((member) => [member.id, member.fullName]));

      let paymentRows: PaymentResult[] = [];
      if (paymentsRes.error) {
        console.error(paymentsRes.error);
        setPayments([]);
        setPaymentsError(paymentsRes.error.message ?? "Failed to load payments");
        markResultReady("payments", {
          source: "network_error",
          resultCount: 0,
        });
        trackCommandPalette("search_failed", {
          stage: "payments",
          message: paymentsRes.error.message ?? "unknown",
        });
      } else {
        paymentRows = (
          (paymentsRes.data ?? []) as Array<{
            id: string;
            amount: number;
            status: string;
            occurred_at: string;
            reference: string | null;
            ikimina_id: string | null;
            member_id: string | null;
            group: { name: string | null } | null;
          }>
        ).map((row) => ({
          id: row.id,
          amount: row.amount,
          status: row.status,
          occurredAt: row.occurred_at,
          reference: row.reference,
          ikiminaId: row.ikimina_id,
          ikiminaName: row.group?.name ?? null,
          memberId: row.member_id,
          memberName: row.member_id ? (memberNameMap.get(row.member_id) ?? null) : null,
        }));
        setPayments(paymentRows);
        setPaymentsError(null);
        markResultReady("payments", {
          source: "network",
          resultCount: paymentRows.length,
        });
      }
      setPaymentsLoading(false);

      const cacheTimestamp = Date.now();
      SEARCH_CACHE.set(cacheKey, {
        ikimina: rows,
        members: membersRes.error ? [] : memberRows,
        payments: paymentsRes.error ? [] : paymentRows,
        error: null,
        membersError: membersRes.error
          ? (membersRes.error.message ?? "Failed to load members")
          : null,
        paymentsError: paymentsRes.error
          ? (paymentsRes.error.message ?? "Failed to load payments")
          : null,
        timestamp: cacheTimestamp,
      });
      setLastSyncedAt(new Date(cacheTimestamp));
      const now = Date.now();
      if (!toastShownRef.current) {
        toast.notify(t("search.console.refreshed", "Search results refreshed"));
        toastShownRef.current = true;
        lastRefreshToastAt.current = now;
      } else {
        if (refreshBadgeTimer.current) {
          clearTimeout(refreshBadgeTimer.current);
        }
        setShowRefreshBadge(true);
        refreshBadgeTimer.current = setTimeout(() => {
          setShowRefreshBadge(false);
          refreshBadgeTimer.current = null;
        }, 5000);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [open, profile.role, profile.sacco_id, supabase, toast, t]);

  useEffect(() => {
    return () => {
      if (refreshBadgeTimer.current) {
        clearTimeout(refreshBadgeTimer.current);
      }
    };
  }, []);

  const filteredNav = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return navItems;
    return navItems.filter(
      (item) =>
        item.primary.toLowerCase().includes(term) || item.secondary.toLowerCase().includes(term)
    );
  }, [navItems, query]);

  const filteredQuickActionGroups = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return quickActions;
    }
    return quickActions
      .map((group) => ({
        ...group,
        actions: group.actions.filter((action) => {
          const haystack = [
            action.primary,
            action.secondary,
            action.description,
            action.secondaryDescription,
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(term);
        }),
      }))
      .filter((group) => group.actions.length > 0);
  }, [quickActions, query]);

  const flattenedQuickActions = useMemo(
    () =>
      filteredQuickActionGroups.flatMap((group) =>
        group.actions.map((action) => ({ groupId: group.id, action }))
      ),
    [filteredQuickActionGroups]
  );

  const actionIndexByGroup = useMemo(() => {
    const map = new Map<string, number>();
    let offset = 0;
    for (const group of filteredQuickActionGroups) {
      map.set(group.id, offset);
      offset += group.actions.length;
    }
    return map;
  }, [filteredQuickActionGroups]);

  const filteredIkimina = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return ikimina.slice(0, 12);
    return ikimina
      .filter((row) => {
        const haystack = `${row.name} ${row.code} ${row.saccoName ?? ""}`.toLowerCase();
        return haystack.includes(term);
      })
      .slice(0, 12);
  }, [ikimina, query]);

  const filteredMembers = useMemo(() => {
    const term = query.trim().toLowerCase();
    const limit = term ? 15 : 8;
    const source = term
      ? members.filter((member) => {
          const haystack = [
            member.fullName,
            member.memberCode ?? "",
            member.msisdn ?? "",
            member.ikiminaName ?? "",
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(term);
        })
      : members;
    return source.slice(0, limit);
  }, [members, query]);

  const filteredPayments = useMemo(() => {
    const term = query.trim().toLowerCase();
    const limit = term ? 12 : 6;
    const source = term
      ? payments.filter((payment) => {
          const haystack = [
            payment.reference ?? "",
            payment.ikiminaName ?? "",
            payment.memberName ?? "",
            payment.status,
            payment.amount.toString(),
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(term);
        })
      : payments;
    return source.slice(0, limit);
  }, [payments, query]);

  const navOffset = 0;
  const navCount = filteredNav.length;
  const actionOffset = navOffset + navCount;
  const ikiminaOffset = actionOffset + flattenedQuickActions.length;
  const membersOffset = ikiminaOffset + filteredIkimina.length;
  const paymentsOffset = membersOffset + filteredMembers.length;
  const totalFocusCount = paymentsOffset + filteredPayments.length;

  const focusItem = useCallback((index: number) => {
    const element = focusRefs.current[index];
    if (element) {
      element.focus();
    }
  }, []);

  const registerFocus = useCallback(
    (index: number) => (element: HTMLAnchorElement | null) => {
      focusRefs.current[index] = element;
    },
    []
  );

  const handleResultKeyDown = useCallback(
    (event: ReactKeyboardEvent, index: number) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        const next = Math.min(totalFocusCount - 1, index + 1);
        if (next >= 0 && next < totalFocusCount) {
          focusItem(next);
        }
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (index === 0) {
          inputRef.current?.focus();
        } else {
          focusItem(Math.max(0, index - 1));
        }
      }
    },
    [focusItem, totalFocusCount]
  );

  const handleInputKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === "ArrowDown" && totalFocusCount > 0) {
        event.preventDefault();
        focusItem(0);
      } else if (event.key === "ArrowUp" && totalFocusCount > 0) {
        event.preventDefault();
        focusItem(totalFocusCount - 1);
      }
    },
    [focusItem, totalFocusCount]
  );

  useEffect(() => {
    focusRefs.current = focusRefs.current.slice(0, totalFocusCount);
  }, [totalFocusCount]);

  useEffect(() => {
    if (!open) {
      focusRefs.current = [];
    }
  }, [open]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-RW", {
        style: "currency",
        currency: "RWF",
        maximumFractionDigits: 0,
      }),
    []
  );

  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-RW", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    []
  );

  const lastSyncedLabel = useMemo(() => {
    if (!lastSyncedAt) return "—";
    return dateTimeFormatter.format(lastSyncedAt);
  }, [lastSyncedAt, dateTimeFormatter]);

  if (!open) {
    return null;
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      hideCloseButton
      labelledBy={dialogTitleId}
      initialFocusRef={inputRef}
      className="glass relative flex h-[min(90vh,720px)] max-w-4xl flex-col rounded-3xl p-6 text-neutral-0 shadow-2xl"
    >
      {() => (
        <div className="flex h-full flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span id={dialogTitleId} className="text-lg font-semibold text-neutral-0">
              {t("search.console.title", "Search console")}
            </span>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-neutral-2">
              <span className="hidden rounded-full border border-white/15 px-3 py-1 md:inline-flex">
                ⌘K
              </span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.3em] text-neutral-2 transition hover:border-white/30 hover:text-neutral-0"
              >
                {t("actions.close", "Close")}
              </button>
            </div>
          </div>

        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-2" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              const value = event.target.value;
              setQuery(value);
              const trimmed = value.trim();
              if (lastQueryLoggedRef.current !== trimmed) {
                lastQueryLoggedRef.current = trimmed;
                trackCommandPalette("query_change", {
                  length: trimmed.length,
                  empty: trimmed.length === 0,
                });
              }
            }}
            onKeyDown={handleInputKeyDown}
            placeholder={t(
              "search.console.placeholder",
              "Search ikimina, quick actions, or SACCO registry"
            )}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
          <aside className="space-y-5">
            <section role="region" aria-labelledby="navigation-heading">
              <header className="mb-2 text-[11px] uppercase tracking-[0.35em] text-neutral-2">
                <h3 id="navigation-heading" className="text-[11px] uppercase tracking-[0.35em]">
                  {t("search.console.navigate", "Navigate")}
                </h3>
              </header>
              <ul className="space-y-2">
                {filteredNav.length === 0 && (
                  <li className="text-xs text-neutral-2">
                    {t("search.console.noSections", "No sections found.")}
                  </li>
                )}
                {filteredNav.map((item, idx) => {
                  const globalIndex = navOffset + idx;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() =>
                          handleNavigate("nav", {
                            href: item.href,
                            index: globalIndex,
                            query: query.trim(),
                          })
                        }
                        ref={registerFocus(globalIndex)}
                        onKeyDown={(event) => handleResultKeyDown(event, globalIndex)}
                        tabIndex={-1}
                        className="flex flex-col rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-0 transition hover:border-white/20 hover:bg-white/10"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <span className="font-medium">
                              {renderHighlighted(item.primary, query)}
                            </span>
                            <span className="block text-[11px] uppercase tracking-[0.3em] text-neutral-2">
                              {item.secondary}
                            </span>
                          </div>
                          {item.badge && (
                            <span
                              className={cn(
                                "inline-flex h-min items-center rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.3em]",
                                BADGE_TONE_STYLES[item.badge.tone]
                              )}
                            >
                              {item.badge.label}
                            </span>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section role="region" aria-labelledby="quick-actions-heading">
              <header className="mb-2 text-[11px] uppercase tracking-[0.35em] text-neutral-2">
                <h3 id="quick-actions-heading" className="text-[11px] uppercase tracking-[0.35em]">
                  {t("search.console.quickActions", "Quick actions")}
                </h3>
              </header>
              <div className="space-y-3">
                {filteredQuickActionGroups.length === 0 && (
                  <p className="text-xs text-neutral-2">
                    {t("search.console.tryAnother", "Try another phrase to find workflows.")}
                  </p>
                )}
                {filteredQuickActionGroups.map((group) => {
                  const baseIndex = actionIndexByGroup.get(group.id) ?? 0;
                  return (
                    <div key={group.id} className="space-y-2">
                      <p className="text-[10px] uppercase tracking-[0.35em] text-neutral-3">
                        {group.title}
                      </p>
                      <ul className="space-y-2">
                        {group.actions.map((action, idx) => {
                          const globalIndex = actionOffset + baseIndex + idx;
                          return (
                            <li key={`${group.id}-${action.primary}`}>
                              <Link
                                href={action.href}
                                onClick={() =>
                                  handleNavigate("quick_action", {
                                    href: action.href,
                                    groupId: group.id,
                                    action: action.primary,
                                    index: globalIndex,
                                    query: query.trim(),
                                  })
                                }
                                ref={registerFocus(globalIndex)}
                                onKeyDown={(event) => handleResultKeyDown(event, globalIndex)}
                                tabIndex={-1}
                                className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-neutral-0 transition hover:border-white/20 hover:bg-white/10"
                              >
                                <span className="font-medium">
                                  {renderHighlighted(action.primary, query)}
                                </span>
                                <span className="text-xs text-neutral-2">{action.description}</span>
                                <span className="text-[11px] uppercase tracking-[0.3em] text-neutral-2">
                                  {action.secondary} · {action.secondaryDescription}
                                </span>
                                {action.badge && (
                                  <span
                                    className={cn(
                                      "mt-1 inline-flex w-max items-center rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.3em]",
                                      BADGE_TONE_STYLES[action.badge.tone]
                                    )}
                                  >
                                    {action.badge.label}
                                  </span>
                                )}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          </aside>

          <section className="space-y-5" aria-labelledby="ikimina-search-heading">
            <div>
              <header className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-neutral-2">
                <h3 id="ikimina-search-heading" className="text-[11px] uppercase tracking-[0.35em]">
                  {t("search.ikimina.title", "Ikimina search")}
                </h3>
                <span className="flex flex-col text-[10px] text-neutral-3" aria-live="polite">
                  <span>
                    {ikimina.length} {t("search.common.loadedSuffix", "loaded")}
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.3em] text-neutral-3/80">
                    {t("search.common.lastSyncedPrefix", "Last synced")} · {lastSyncedLabel}
                  </span>
                  {showRefreshBadge && (
                    <span className="mt-1 inline-flex items-center gap-1 self-start rounded-full bg-rw-blue/20 px-2 py-1 text-[9px] uppercase tracking-[0.3em] text-neutral-0">
                      <span className="h-2 w-2 rounded-full bg-rw-yellow" />{" "}
                      {t("common.updated", "Updated")}
                    </span>
                  )}
                </span>
              </header>
              <div className="max-h-80 overflow-y-auto rounded-2xl border border-white/10">
                {loading ? (
                  <div className="flex items-center gap-2 px-4 py-6 text-sm text-neutral-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading ikimina…
                  </div>
                ) : error ? (
                  <div className="px-4 py-6 text-sm text-red-300">{error}</div>
                ) : filteredIkimina.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-neutral-2">
                    {t(
                      "search.ikimina.noMatch",
                      "No ikimina match your search. Try refining the term or clear the search."
                    )}
                  </div>
                ) : (
                  <ul className="divide-y divide-white/5 text-sm text-neutral-0">
                    {filteredIkimina.map((item, idx) => {
                      const globalIndex = ikiminaOffset + idx;
                      return (
                        <li key={item.id}>
                          <Link
                            href={`/ikimina/${item.id}`}
                            onClick={() =>
                              handleNavigate("ikimina", {
                                id: item.id,
                                code: item.code,
                                index: globalIndex,
                                query: query.trim(),
                              })
                            }
                            ref={registerFocus(globalIndex)}
                            onKeyDown={(event) => handleResultKeyDown(event, globalIndex)}
                            tabIndex={-1}
                            className="flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-white/8"
                          >
                            <div>
                              <span className="font-medium">
                                {renderHighlighted(item.primary, query)}
                              </span>
                              <span className="block text-[11px] uppercase tracking-[0.3em] text-neutral-2">
                                {item.secondary}
                              </span>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-neutral-2" aria-hidden />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <div role="region" aria-labelledby="members-search-heading">
              <header className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-neutral-2">
                <h3 id="members-search-heading" className="text-[11px] uppercase tracking-[0.35em]">
                  {t("search.members.title", "Member search")}
                </h3>
                <span className="text-[10px] text-neutral-3" aria-live="polite">
                  {members.length} {t("search.common.loadedSuffix", "loaded")}
                </span>
              </header>
              <div className="max-h-72 overflow-y-auto rounded-2xl border border-white/10">
                {membersLoading ? (
                  <div className="flex items-center gap-2 px-4 py-6 text-sm text-neutral-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading members…
                  </div>
                ) : membersError ? (
                  <div className="px-4 py-6 text-sm text-red-300">{membersError}</div>
                ) : filteredMembers.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-neutral-2">
                    {t(
                      "search.members.none",
                      "No members match your search. Try another code, name, or phone number."
                    )}
                  </div>
                ) : (
                  <ul className="divide-y divide-white/5 text-sm text-neutral-0">
                    {filteredMembers.map((member, idx) => {
                      const globalIndex = membersOffset + idx;
                      const memberHref = member.ikiminaId
                        ? `/ikimina/${member.ikiminaId}`
                        : "/ikimina";
                      return (
                        <li key={member.id}>
                          <Link
                            href={memberHref}
                            onClick={() =>
                              handleNavigate("member", {
                                memberId: member.id,
                                ikiminaId: member.ikiminaId,
                                index: globalIndex,
                                query: query.trim(),
                              })
                            }
                            ref={registerFocus(globalIndex)}
                            onKeyDown={(event) => handleResultKeyDown(event, globalIndex)}
                            tabIndex={-1}
                            className="flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-white/8"
                          >
                            <div>
                              <p className="font-medium">
                                {renderHighlighted(member.fullName, query)}
                              </p>
                              <p className="text-xs text-neutral-2">
                                {member.memberCode ? (
                                  <>
                                    Code ·{" "}
                                    <span className="font-mono text-neutral-1">
                                      {renderHighlighted(member.memberCode ?? "", query)}
                                    </span>
                                  </>
                                ) : (
                                  <span>{t("search.members.noCode", "No member code")}</span>
                                )}
                              </p>
                              {member.badge && (
                                <span className="text-xs text-neutral-2">
                                  {member.badge.label}
                                </span>
                              )}
                            </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                )}
              </div>
            </div>

              <section role="region" aria-labelledby="actions-heading">
                <header className="mb-2 text-[11px] uppercase tracking-[0.35em] text-neutral-2">
                  <h3 id="actions-heading" className="text-[11px] uppercase tracking-[0.35em]">
                    {t("search.console.quickActions", "Quick actions")}
                  </h3>
                </header>
                <ul className="space-y-2">
                  {flattenedQuickActions.length === 0 && (
                    <li className="text-xs text-neutral-2">
                      {t("search.console.noQuickActions", "No quick actions match")}
                    </li>
                  )}
                  {flattenedQuickActions.map((entry, idx) => {
                    const globalIndex = quickActionsOffset + idx;
                    return (
                      <li key={`${entry.groupId}-${entry.action.primary}`}>
                        <Link
                          href={entry.action.href}
                          onClick={onClose}
                          ref={registerFocus(globalIndex)}
                          onKeyDown={(event) => handleResultKeyDown(event, globalIndex)}
                          tabIndex={-1}
                          className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-0 transition hover:border-white/20 hover:bg-white/10"
                        >
                          <span className="font-medium">
                            {renderHighlighted(entry.action.primary, query)}
                          </span>
                          <span className="text-[11px] uppercase tracking-[0.3em] text-neutral-2">
                            {entry.action.secondary}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-neutral-2"
                aria-live="polite"
              >
                <header className="mb-1 text-[11px] uppercase tracking-[0.35em] text-neutral-2">
                  {t("search.console.lastSynced", "Last synced")}
                </header>
                <p className="text-sm text-neutral-0">{lastSyncedLabel}</p>
                <p className="mt-2 text-xs">
                  {t("search.console.refreshHint", "Results auto-refresh every few minutes.")}
                </p>
              </section>
            </aside>

            <main className="space-y-6">
              <section aria-labelledby="ikimina-heading" className="space-y-3">
                <header className="flex items-baseline justify-between">
                  <h2
                    id="ikimina-heading"
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-0"
                  >
                    {t("search.console.ikimina", "Ikimina")}
                  </h2>
                  <span className="text-[11px] text-neutral-2">
                    {t("search.console.resultsCount", "{count} results", {
                      count: filteredIkimina.length,
                    })}
                  </span>
                </header>

            <div role="region" aria-labelledby="payments-search-heading">
              <header className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-neutral-2">
                <h3
                  id="payments-search-heading"
                  className="text-[11px] uppercase tracking-[0.35em]"
                >
                  {t("search.payments.title", "Recent payments")}
                </h3>
                <span className="text-[10px] text-neutral-3" aria-live="polite">
                  {payments.length} {t("search.common.loadedSuffix", "loaded")}
                </span>
              </header>
              <div className="max-h-72 overflow-y-auto rounded-2xl border border-white/10">
                {paymentsLoading ? (
                  <div className="flex items-center gap-2 px-4 py-6 text-sm text-neutral-2">
                    <Loader2 className="h-4 w-4 animate-spin" />{" "}
                    {t("search.payments.loading", "Loading payments…")}
                  </div>
                ) : paymentsError ? (
                  <div className="px-4 py-6 text-sm text-red-300">{paymentsError}</div>
                ) : filteredPayments.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-neutral-2">
                    {t(
                      "search.payments.none",
                      "No payments match your search. Search by reference, member, or status."
                    )}
                  </div>
                ) : (
                  <ul className="divide-y divide-white/5 text-sm text-neutral-0">
                    {filteredPayments.map((payment, idx) => {
                      const globalIndex = paymentsOffset + idx;
                      const paymentHref = payment.ikiminaId
                        ? `/ikimina/${payment.ikiminaId}`
                        : "/recon";
                      return (
                        <li key={payment.id}>
                          <Link
                            href={paymentHref}
                            onClick={() =>
                              handleNavigate("payment", {
                                paymentId: payment.id,
                                ikiminaId: payment.ikiminaId,
                                index: globalIndex,
                                query: query.trim(),
                              })
                            }
                            ref={registerFocus(globalIndex)}
                            onKeyDown={(event) => handleResultKeyDown(event, globalIndex)}
                            tabIndex={-1}
                            className="flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-white/8"
                          >
                            <div>
                              <p className="font-medium">
                                {currencyFormatter.format(payment.amount)} · {payment.status}
                              </p>
                              <p className="text-xs text-neutral-2">
                                {payment.memberName ? `${payment.memberName} • ` : ""}
                                {payment.ikiminaName ??
                                  t("search.payments.noIkimina", "No ikimina")}
                              </p>
                              {payment.reference && (
                                <p className="text-[11px] font-mono text-neutral-2">
                                  {renderHighlighted(payment.reference ?? "", query)}
                                </p>
                              )}
                              <p className="text-[11px] text-neutral-3">
                                {formatRelativeDate(payment.occurredAt, dateTimeFormatter)} ·{" "}
                                {dateTimeFormatter.format(new Date(payment.occurredAt))}
                              </p>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-neutral-2" aria-hidden />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <div role="region" aria-labelledby="sacco-picker-heading">
              <header className="mb-2 text-[11px] uppercase tracking-[0.35em] text-neutral-2">
                <h3 id="sacco-picker-heading" className="text-[11px] uppercase tracking-[0.35em]">
                  {t("search.saccoPicker.title", "Semantic SACCO picker")}
                </h3>
              </header>
              <SaccoSearchCombobox
                value={selectedSacco}
                onChange={(value) => {
                  setSelectedSacco(value);
                  trackCommandPalette("sacco_filter", {
                    saccoId: value?.id ?? null,
                    query: query.trim(),
                  });
                }}
                placeholder={t(
                  "search.saccoPicker.placeholder",
                  "Search Umurenge SACCOs by name or district"
                )}
              />
              {selectedSacco && (
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-neutral-0">
                  <p>
                    <span className="font-semibold">{selectedSacco.name}</span> —{" "}
                    {selectedSacco.district} · {selectedSacco.province}
                  </p>
                  <p className="mt-1 text-neutral-2">{selectedSacco.category}</p>
                  {profile.role === "SYSTEM_ADMIN" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSacco(null);
                        router.push("/admin");
                        onClose();
                      }}
                      className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-neutral-0 transition hover:border-white/25 hover:bg-white/10"
                    >
                      {t("search.saccoPicker.manageInAdmin", "Manage in admin")}{" "}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <p className="mt-3 text-[11px] text-neutral-2">
                      {t(
                        "search.saccoPicker.contactAdmin",
                        "Contact your system administrator to update SACCO metadata."
                      )}
                    </p>
                  )}
                  {membersError && <div className="text-xs text-red-300">{membersError}</div>}
                </div>

                <ul className="space-y-2">
                  {filteredMembers.length === 0 && !membersLoading && (
                    <li className="text-xs text-neutral-2">
                      {t("search.console.noMembers", "No members found")}
                    </li>
                  )}
                  {filteredMembers.map((member, idx) => {
                    const globalIndex = membersOffset + idx;
                    return (
                      <li key={member.id}>
                        <Link
                          href={`/members/${member.id}`}
                          onClick={onClose}
                          ref={registerFocus(globalIndex)}
                          onKeyDown={(event) => handleResultKeyDown(event, globalIndex)}
                          tabIndex={-1}
                          className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-0 transition hover:border-white/20 hover:bg-white/10"
                        >
                          <span className="font-semibold">
                            {renderHighlighted(member.fullName, query)}
                          </span>
                          <span className="text-xs text-neutral-2">
                            {member.memberCode ??
                              t("search.console.noMemberCode", "No member code")}
                          </span>
                          <span className="text-xs text-neutral-3">
                            {member.msisdn ?? t("search.console.noPhone", "No phone")}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section aria-labelledby="payments-heading" className="space-y-3">
                <header className="flex items-baseline justify-between">
                  <h2
                    id="payments-heading"
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-0"
                  >
                    {t("search.console.payments", "Payments")}
                  </h2>
                  <span className="text-[11px] text-neutral-2">
                    {paymentsLoading
                      ? t("search.console.loading", "Loading…")
                      : t("search.console.resultsCount", "{count} results", {
                          count: filteredPayments.length,
                        })}
                  </span>
                </header>

                <div className="space-y-2">
                  {paymentsLoading && (
                    <div className="flex items-center gap-2 text-xs text-neutral-2">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      {t("search.console.loadingPayments", "Loading payments")}
                    </div>
                  )}
                  {paymentsError && <div className="text-xs text-red-300">{paymentsError}</div>}
                </div>

                <ul className="space-y-2">
                  {filteredPayments.length === 0 && !paymentsLoading && (
                    <li className="text-xs text-neutral-2">
                      {t("search.console.noPayments", "No payments found")}
                    </li>
                  )}
                  {filteredPayments.map((payment, idx) => {
                    const globalIndex = paymentsOffset + idx;
                    return (
                      <li key={payment.id}>
                        <Link
                          href={`/payments/${payment.id}`}
                          onClick={onClose}
                          ref={registerFocus(globalIndex)}
                          onKeyDown={(event) => handleResultKeyDown(event, globalIndex)}
                          tabIndex={-1}
                          className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-0 transition hover:border-white/20 hover:bg-white/10"
                        >
                          <span className="font-semibold">
                            {currencyFormatter.format(payment.amount)}
                          </span>
                          <span className="text-xs text-neutral-2">
                            {formatRelativeDate(
                              payment.occurredAt ?? payment.occurred_at,
                              dateTimeFormatter
                            )}
                          </span>
                          <span className="text-xs text-neutral-3">
                            {payment.reference ?? t("search.console.noReference", "No reference")}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </main>
          </div>
        </div>
      )}
    </Modal>
  );
}
