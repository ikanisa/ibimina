"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Loader2, Search, X } from "lucide-react";
import type { ProfileRow } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { SaccoSearchCombobox, type SaccoSearchResult } from "@/components/saccos/sacco-search-combobox";
import { BilingualText } from "@/components/common/bilingual-text";
import { useToast } from "@/providers/toast-provider";

const supabase = getSupabaseBrowserClient();

const toBilingual = (en: string, rw: string) => `${en} / ${rw}`;

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

type NavTarget = {
  href: string;
  primary: string;
  secondary: string;
};

type QuickActionTarget = {
  href: string;
  primary: string;
  secondary: string;
  description: string;
  secondaryDescription: string;
};

interface GlobalSearchDialogProps {
  open: boolean;
  onClose: () => void;
  profile: ProfileRow;
  navItems: NavTarget[];
  quickActions: QuickActionTarget[];
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
  const router = useRouter();
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

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelectedSacco(null);
    setError(null);
    const timeout = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 30);
    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let active = true;

    const cacheKey = `${profile.role}-${profile.sacco_id ?? "all"}`;
    const cached = SEARCH_CACHE.get(cacheKey);
    const cacheFresh = cached ? Date.now() - cached.timestamp < CACHE_TTL_MS : false;

    if (cached) {
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
      if (cacheFresh) {
        return () => {
          active = false;
        };
      }
    } else {
      setLoading(true);
      setMembersLoading(true);
      setPaymentsLoading(true);
      setError(null);
      setMembersError(null);
      setPaymentsError(null);
      setIkimina([]);
      setMembers([]);
      setPayments([]);
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
          .select("id, amount, status, occurred_at, reference, ikimina_id, member_id, group:ibimina(name)")
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
      } else {
        memberRows = ((membersRes.data ?? []) as Array<{
          id: string;
          full_name: string;
          member_code: string | null;
          msisdn: string | null;
          ikimina_id: string | null;
          ikimina_name: string | null;
        }>).map((row) => ({
          id: row.id,
          fullName: row.full_name,
          memberCode: row.member_code,
          msisdn: row.msisdn,
          ikiminaId: row.ikimina_id,
          ikiminaName: row.ikimina_name ?? null,
        }));
        setMembers(memberRows);
        setMembersError(null);
      }
      setMembersLoading(false);

      const memberNameMap = new Map(memberRows.map((member) => [member.id, member.fullName]));

      let paymentRows: PaymentResult[] = [];
      if (paymentsRes.error) {
        console.error(paymentsRes.error);
        setPayments([]);
        setPaymentsError(paymentsRes.error.message ?? "Failed to load payments");
      } else {
        paymentRows = ((paymentsRes.data ?? []) as Array<{
          id: string;
          amount: number;
          status: string;
          occurred_at: string;
          reference: string | null;
          ikimina_id: string | null;
          member_id: string | null;
          group: { name: string | null } | null;
        }>).map((row) => ({
          id: row.id,
          amount: row.amount,
          status: row.status,
          occurredAt: row.occurred_at,
          reference: row.reference,
          ikiminaId: row.ikimina_id,
          ikiminaName: row.group?.name ?? null,
          memberId: row.member_id,
          memberName: row.member_id ? memberNameMap.get(row.member_id) ?? null : null,
        }));
        setPayments(paymentRows);
        setPaymentsError(null);
      }
      setPaymentsLoading(false);

      const cacheTimestamp = Date.now();
      SEARCH_CACHE.set(cacheKey, {
        ikimina: rows,
        members: membersRes.error ? [] : memberRows,
        payments: paymentsRes.error ? [] : paymentRows,
        error: null,
        membersError: membersRes.error ? membersRes.error.message ?? "Failed to load members" : null,
        paymentsError: paymentsRes.error ? paymentsRes.error.message ?? "Failed to load payments" : null,
        timestamp: cacheTimestamp,
      });
      setLastSyncedAt(new Date(cacheTimestamp));
      const now = Date.now();
      if (!toastShownRef.current) {
        toast.notify(toBilingual("Search results refreshed", "Ibisubizo byashya byageze"));
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
  }, [open, profile.role, profile.sacco_id, toast]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

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
    return navItems.filter((item) =>
      item.primary.toLowerCase().includes(term) || item.secondary.toLowerCase().includes(term)
    );
  }, [navItems, query]);

  const filteredActions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return quickActions;
    return quickActions.filter((action) => {
      const haystack = [
        action.primary,
        action.secondary,
        action.description,
        action.secondaryDescription,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [quickActions, query]);

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
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 md:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Global search"
      onClick={onClose}
    >
      <div
        className="glass relative w-full max-w-4xl rounded-3xl p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BilingualText
            primary={<span className="text-lg font-semibold text-neutral-0">Search console</span>}
            secondary="Shakisha ibimina"
            secondaryClassName="text-[10px] uppercase tracking-[0.35em] text-neutral-2"
          />
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-neutral-2">
            <span className="hidden rounded-full border border-white/15 px-3 py-1 md:inline-flex">⌘K</span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.3em] text-neutral-2 transition hover:border-white/30 hover:text-neutral-0"
            >
              <BilingualText
                primary="Close"
                secondary="Funga"
                layout="inline"
                className="items-center gap-1"
                secondaryClassName="text-[10px] text-neutral-3"
              />
            </button>
          </div>
        </div>

        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-2" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={toBilingual("Search ikimina, quick actions, or SACCO registry", "Shakisha amatsinda, ibikorwa byihuse, cyangwa urutonde rwa SACCO")}
            className="w-full rounded-2xl border border-white/10 bg-white/10 py-3 pl-11 pr-4 text-sm text-neutral-0 placeholder:text-neutral-2 focus:outline-none focus:ring-2 focus:ring-rw-blue"
          />
          {query && (
           <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 text-neutral-2 transition hover:text-neutral-0"
              aria-label="Clear search"
            >
              <span className="sr-only">{toBilingual("Clear", "Siba")}</span>
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
          <aside className="space-y-5">
            <section>
              <header className="mb-2 text-[11px] uppercase tracking-[0.35em] text-neutral-2">Navigate</header>
              <ul className="space-y-2">
                {filteredNav.length === 0 && (
                  <li className="text-xs text-neutral-2">{toBilingual("No sections found.", "Nta gice cyabonetse.")}</li>
                )}
                {filteredNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="flex flex-col rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-0 transition hover:border-white/20 hover:bg-white/10"
                    >
                      <span className="font-medium">{renderHighlighted(item.primary, query)}</span>
                      <span className="text-[11px] uppercase tracking-[0.3em] text-neutral-2">
                        {item.secondary}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <header className="mb-2 text-[11px] uppercase tracking-[0.35em] text-neutral-2">
                Quick actions
              </header>
              <ul className="space-y-2">
                {filteredActions.length === 0 && (
                  <li className="text-xs text-neutral-2">Try another phrase to find workflows.</li>
                )}
                {filteredActions.map((action) => (
                  <li key={action.primary}>
                    <Link
                      href={action.href}
                      onClick={onClose}
                      className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-neutral-0 transition hover:border-white/20 hover:bg-white/10"
                    >
                      <span className="font-medium">{renderHighlighted(action.primary, query)}</span>
                      <span className="text-xs text-neutral-2">{action.description}</span>
                      <span className="text-[11px] uppercase tracking-[0.3em] text-neutral-2">
                        {action.secondary} · {action.secondaryDescription}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </aside>

          <section className="space-y-5">
            <div>
              <header className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-neutral-2">
                <span>Ikimina search</span>
                <span className="flex flex-col text-[10px] text-neutral-3">
                  <span>{ikimina.length} loaded</span>
                  <span className="text-[9px] uppercase tracking-[0.3em] text-neutral-3/80">Last synced · {lastSyncedLabel}</span>
                  {showRefreshBadge && (
                    <span className="mt-1 inline-flex items-center gap-1 self-start rounded-full bg-rw-blue/20 px-2 py-1 text-[9px] uppercase tracking-[0.3em] text-neutral-0">
                      <span className="h-2 w-2 rounded-full bg-rw-yellow" /> {toBilingual("Updated", "Byavuguruwe")}
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
                    {toBilingual(`No ikimina match “${query}”. Try refining the term or clear the search.`, `Nta ikimina rihura na “${query}”. Hindura uko ushakisha cyangwa siba.`)}
                  </div>
                ) : (
                  <ul className="divide-y divide-white/5 text-sm text-neutral-0">
                    {filteredIkimina.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={`/ikimina/${item.id}`}
                          onClick={onClose}
                          className="flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-white/8"
                        >
                          <div>
                            <p className="font-medium">{renderHighlighted(item.name, query)}</p>
                            <p className="text-xs text-neutral-2">
                              Code · <span className="font-mono text-neutral-1">{item.code}</span>
                              {item.saccoName ? ` • ${item.saccoName}` : ""}
                            </p>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-neutral-2" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div>
              <header className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-neutral-2">
                <span>Member search</span>
                <span className="text-[10px] text-neutral-3">{members.length} loaded</span>
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
                    No members found for “{query}”. Try another code, name, or phone number.
                  </div>
                ) : (
                  <ul className="divide-y divide-white/5 text-sm text-neutral-0">
                    {filteredMembers.map((member) => {
                      const memberHref = member.ikiminaId ? `/ikimina/${member.ikiminaId}` : "/ikimina";
                      return (
                        <li key={member.id}>
                          <Link
                            href={memberHref}
                            onClick={onClose}
                            className="flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-white/8"
                          >
                            <div>
                              <p className="font-medium">{renderHighlighted(member.fullName, query)}</p>
                              <p className="text-xs text-neutral-2">
                                {member.memberCode ? (
                                  <>
                                    Code · <span className="font-mono text-neutral-1">{renderHighlighted(member.memberCode ?? "", query)}</span>
                                  </>
                                ) : (
                                  <span>No member code</span>
                                )}
                                {member.msisdn && (
                                  <>
                                    {" "}• {renderHighlighted(member.msisdn ?? "", query)}
                                  </>
                                )}
                                {member.ikiminaName && (
                                  <>
                                    {" "}• {member.ikiminaName}
                                  </>
                                )}
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

            <div>
              <header className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-neutral-2">
                <span>Recent payments</span>
                <span className="text-[10px] text-neutral-3">{payments.length} loaded</span>
              </header>
              <div className="max-h-72 overflow-y-auto rounded-2xl border border-white/10">
                {paymentsLoading ? (
                  <div className="flex items-center gap-2 px-4 py-6 text-sm text-neutral-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading payments…
                  </div>
                ) : paymentsError ? (
                  <div className="px-4 py-6 text-sm text-red-300">{paymentsError}</div>
                ) : filteredPayments.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-neutral-2">
                    No payments match “{query}”. Search by reference, member, or status.
                  </div>
                ) : (
                  <ul className="divide-y divide-white/5 text-sm text-neutral-0">
                    {filteredPayments.map((payment) => {
                      const paymentHref = payment.ikiminaId ? `/ikimina/${payment.ikiminaId}` : "/recon";
                      return (
                        <li key={payment.id}>
                          <Link
                            href={paymentHref}
                            onClick={onClose}
                            className="flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-white/8"
                          >
                            <div>
                              <p className="font-medium">
                                {currencyFormatter.format(payment.amount)} · {payment.status}
                              </p>
                              <p className="text-xs text-neutral-2">
                                {payment.memberName ? `${payment.memberName} • ` : ""}
                                {payment.ikiminaName ?? "No ikimina"}
                              </p>
                              {payment.reference && (
                                <p className="text-[11px] font-mono text-neutral-2">
                                  {renderHighlighted(payment.reference ?? "", query)}
                                </p>
                              )}
                              <p className="text-[11px] text-neutral-3">
                                {formatRelativeDate(payment.occurredAt, dateTimeFormatter)} · {dateTimeFormatter.format(new Date(payment.occurredAt))}
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

            <div>
              <header className="mb-2 text-[11px] uppercase tracking-[0.35em] text-neutral-2">
                Semantic SACCO picker
              </header>
              <SaccoSearchCombobox
                value={selectedSacco}
                onChange={(value) => setSelectedSacco(value)}
                placeholder="Search Umurenge SACCOs by name or district"
              />
              {selectedSacco && (
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-neutral-0">
                  <p>
                    <span className="font-semibold">{selectedSacco.name}</span> — {selectedSacco.district} · {selectedSacco.province}
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
                      Manage in admin <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <p className="mt-3 text-[11px] text-neutral-2">
                      Contact your system administrator to update SACCO metadata.
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
