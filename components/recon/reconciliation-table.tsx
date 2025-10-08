"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition, useDeferredValue } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { StatusChip } from "@/components/common/status-chip";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/providers/toast-provider";
import { BilingualText } from "@/components/common/bilingual-text";

const supabase = getSupabaseBrowserClient();

export type ReconciliationRow = Database["public"]["Tables"]["payments"]["Row"] & {
  source: Pick<Database["public"]["Tables"]["sms_inbox"]["Row"], "raw_text" | "parsed_json" | "msisdn" | "received_at"> | null;
};

interface ReconciliationTableProps {
  rows: ReconciliationRow[];
  saccoId: string | null;
  canWrite: boolean;
}

const STATUS_OPTIONS: Database["public"]["Tables"]["payments"]["Row"]["status"][] = [
  "UNALLOCATED",
  "PENDING",
  "POSTED",
  "SETTLED",
  "REJECTED",
];

const CONFIDENCE_THRESHOLD = 0.8;

type ReasonChip = {
  id: string;
  label: { primary: string; secondary: string };
  tone: "warning" | "critical" | "info";
};

const joinBilingual = (primary: string, secondary: string) => `${primary} / ${secondary}`;

const STATUS_BILINGUAL: Record<string, { primary: string; secondary: string }> = {
  UNALLOCATED: { primary: "unallocated", secondary: "bitaragabanywa" },
  PENDING: { primary: "pending", secondary: "birategereje" },
  POSTED: { primary: "posted", secondary: "byemejwe" },
  SETTLED: { primary: "settled", secondary: "byarangije" },
  REJECTED: { primary: "rejected", secondary: "byanzwe" },
};

const getStatusLabel = (status: Database["public"]["Tables"]["payments"]["Row"]["status"]) =>
  STATUS_BILINGUAL[status] ?? { primary: status.toLowerCase(), secondary: status.toLowerCase() };

type MemberResult = {
  id: string;
  full_name: string;
  member_code: string | null;
  msisdn: string | null;
  ikimina_id: string;
  ikimina_name: string | null;
};

const reasonRules = {
  missingReference: {
    id: "missing-reference",
    label: { primary: "Missing reference", secondary: "Indango ibura" },
    tone: "warning" as const,
  },
  unallocated: {
    id: "needs-member",
    label: { primary: "Member not matched", secondary: "Umunyamuryango ntabonekanye" },
    tone: "critical" as const,
  },
  duplicate: {
    id: "duplicate",
    label: { primary: "Duplicate txn", secondary: "Ubutumwa bwisubiyemo" },
    tone: "warning" as const,
  },
  pendingReview: {
    id: "manual-review",
    label: { primary: "Manual review", secondary: "Gusuzumwa n'intoki" },
    tone: "info" as const,
  },
  parserFailure: {
    id: "parser-failure",
    label: { primary: "Parser missing fields", secondary: "Ibyatanzwe ntibyuzuye" },
    tone: "warning" as const,
  },
  msisdnMismatch: {
    id: "msisdn-mismatch",
    label: { primary: "Masked MSISDN", secondary: "Numero yihishwe" },
    tone: "warning" as const,
  },
  lowConfidence: {
    id: "low-confidence",
    label: { primary: "Low confidence", secondary: "Icyizere gito" },
    tone: "warning" as const,
  },
} satisfies Record<string, ReasonChip>;

const reasonEntries = Object.values(reasonRules);

const reasonGuidance: Record<ReasonChip["id"], { primary: string; secondary: string }> = {
  "missing-reference": {
    primary: "Add a SACCO.IKIMINA(.MEMBER) reference before posting.",
    secondary: "Shyiraho indango SACCO.IKIMINA(.MEMER) mbere yo kubyemeza.",
  },
  "needs-member": {
    primary: "Link to a member to clear unallocated funds.",
    secondary: "Huza n'umunyamuryango kugirango ukureho amafaranga ataraboneka.",
  },
  duplicate: {
    primary: "Compare with existing transactions sharing this reference.",
    secondary: "Gereranya n'ubundi butumwa bufite iyi ndango.",
  },
  "manual-review": {
    primary: "Review supporting documents before updating status.",
    secondary: "Suzuma ibimenyetso mbere yo guhindura imiterere.",
  },
  "parser-failure": {
    primary: "Fix the SMS format and retry the parser or assign manually.",
    secondary: "Hindura imiterere ya SMS wongere ubishakishe cyangwa ubihuze intoki.",
  },
  "msisdn-mismatch": {
    primary: "Capture the sender MSISDN from statements for future auto-matching.",
    secondary: "Andika nimero ya telefoni ku nyandiko kugirango bizafashe guhuza ku buryo bwikora." ,
  },
  "low-confidence": {
    primary: "Double-check amount and reference before marking posted.",
    secondary: "Ongera wemeze amafaranga n'indango mbere yo kubyemeza.",
  },
};

export function ReconciliationTable({ rows, saccoId, canWrite }: ReconciliationTableProps) {
  const [selected, setSelected] = useState<ReconciliationRow | null>(null);
  const [newStatus, setNewStatus] = useState<string>("POSTED");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkIkiminaId, setBulkIkiminaId] = useState("");
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [memberQuery, setMemberQuery] = useState("");
  const [memberResults, setMemberResults] = useState<MemberResult[]>([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    member_id: string;
    ikimina_id: string | null;
    confidence: number;
    reason: string;
    member_code?: string | null;
  } | null>(null);
  const [aiAlternatives, setAiAlternatives] = useState<
    Array<{
      member_id: string;
      ikimina_id: string | null;
      confidence: number;
      reason: string;
      member_code?: string | null;
    }>
  >([]);
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiRefreshToken, setAiRefreshToken] = useState(0);
  const [pending, startTransition] = useTransition();
  const { success: toastSuccess, error: toastError } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showLowConfidence, setShowLowConfidence] = useState(false);
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const [reasonFilters, setReasonFilters] = useState<string[]>([]);

  const deferredSearch = useDeferredValue(searchTerm);
  const suggestionCache = useRef(
    new Map<
      string,
      {
        suggestion: {
          member_id: string;
          ikimina_id: string | null;
          confidence: number;
          reason: string;
          member_code?: string | null;
        } | null;
        alternatives: Array<{
          member_id: string;
          ikimina_id: string | null;
          confidence: number;
          reason: string;
          member_code?: string | null;
        }>;
      }
    >()
  );

  const duplicateTxnIds = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      if (!row.txn_id) continue;
      counts.set(row.txn_id, (counts.get(row.txn_id) ?? 0) + 1);
    }
    return new Set(Array.from(counts.entries()).filter(([, count]) => count > 1).map(([txnId]) => txnId));
  }, [rows]);

  const deriveReasons = useCallback(
    (row: ReconciliationRow): ReasonChip[] => {
      const reasons: ReasonChip[] = [];

      if (!row.reference) {
        reasons.push(reasonRules.missingReference);
      }

      if (row.status === "UNALLOCATED") {
        reasons.push(reasonRules.unallocated);
      }

      if (duplicateTxnIds.has(row.txn_id)) {
        reasons.push(reasonRules.duplicate);
      }

      if (row.status === "PENDING") {
        reasons.push(reasonRules.pendingReview);
      }

      if (!row.source?.parsed_json) {
        reasons.push(reasonRules.parserFailure);
      }

      if (!row.msisdn || row.msisdn.includes("✱") || row.msisdn.includes("****")) {
        reasons.push(reasonRules.msisdnMismatch);
      }

      if ((row.confidence ?? 1) < CONFIDENCE_THRESHOLD) {
        reasons.push(reasonRules.lowConfidence);
      }

      return reasons;
    },
    [duplicateTxnIds],
  );

  const rowMap = useMemo(() => {
    const map = new Map<string, ReconciliationRow>();
    rows.forEach((row) => {
      map.set(row.id, row);
    });
    return map;
  }, [rows]);

  const filteredRows = useMemo(() => {
    const reasonSet = new Set(reasonFilters);
    const query = deferredSearch.trim().toLowerCase();

    return rows.filter((row) => {
      if (statusFilter !== "ALL" && row.status !== statusFilter) {
        return false;
      }

      if (showDuplicatesOnly && !duplicateTxnIds.has(row.txn_id)) {
        return false;
      }

      if (showLowConfidence && (row.confidence ?? 1) >= CONFIDENCE_THRESHOLD) {
        return false;
      }

      if (reasonSet.size > 0) {
        const reasons = deriveReasons(row);
        if (!reasons.some((reason) => reasonSet.has(reason.id))) {
          return false;
        }
      }

      if (!query) {
        return true;
      }

      const haystack = `${row.reference ?? ""} ${row.msisdn ?? ""} ${row.txn_id ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [rows, statusFilter, showDuplicatesOnly, showLowConfidence, reasonFilters, duplicateTxnIds, deriveReasons, deferredSearch]);

  const displayRows = useMemo(() =>
    [...filteredRows].sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1)),
  [filteredRows]);

  const selectedReasons = useMemo(
    () => (selected ? deriveReasons(selected) : []),
    [selected, deriveReasons],
  );

  const allSelected = selectedIds.length > 0 && selectedIds.length === displayRows.length;

  const toggleSelect = (id: string) => {
    if (!canWrite) return;
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const toggleSelectAll = () => {
    if (!canWrite) return;
    if (allSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(displayRows.map((row) => row.id));
  };

  const handleBulkStatus = (status: Database["public"]["Tables"]["payments"]["Row"]["status"]) => {
    if (!canWrite || !selectedIds.length) return;
    startTransition(async () => {
      setBulkMessage(null);
      setBulkError(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("payments")
        .update({ status })
        .in("id", selectedIds);
      if (error) {
        const message = error.message ?? "Failed to update status";
        const bilingualMessage = joinBilingual(message, "Guhindura imiterere byanze");
        setBulkError(bilingualMessage);
        toastError(bilingualMessage);
        return;
      }
      const statusLabel = getStatusLabel(status);
      const count = selectedIds.length;
      const messageEn = `Updated ${count} payment(s) to ${statusLabel.primary}. Refresh to verify.`;
      const messageRw = `Byavuguruye imisanzu ${count} kuri ${statusLabel.secondary}. Ongera wemeze.`;
      setBulkMessage(joinBilingual(messageEn, messageRw));
      toastSuccess(joinBilingual(`Marked ${count} payment(s) as ${statusLabel.primary}`, `Imisanzu ${count} yashyizwe kuri ${statusLabel.secondary}`));
      setSelectedIds([]);
    });
  };

  const handleBulkAssign = () => {
    const trimmed = bulkIkiminaId.trim();
    if (!canWrite || !trimmed || !selectedIds.length) {
      return;
    }
    startTransition(async () => {
      setBulkMessage(null);
      setBulkError(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("payments")
        .update({ ikimina_id: trimmed })
        .in("id", selectedIds);
      if (error) {
        const message = error.message ?? "Failed to assign ikimina";
        const bilingualMessage = joinBilingual(message, "Guhuza n'ikimina byanze");
        setBulkError(bilingualMessage);
        toastError(bilingualMessage);
        return;
      }
      const count = selectedIds.length;
      const assignedEn = `Assigned ${count} payment(s) to ikimina.`;
      const assignedRw = `Imisanzu ${count} yashyizwe ku ikimina.`;
      setBulkMessage(joinBilingual(assignedEn, assignedRw));
      toastSuccess(joinBilingual(`Assigned ${count} payment(s).`, `Imisanzu ${count} yashyizweho.`));
      setSelectedIds([]);
      setBulkIkiminaId("");
    });
  };

  const handleBulkAssignByReference = () => {
    if (!canWrite || selectedIds.length === 0) return;
    const references = selectedIds
      .map((id) => rowMap.get(id)?.reference ?? null)
      .filter((value): value is string => Boolean(value));
    if (references.length !== selectedIds.length) {
      setBulkError(joinBilingual("All selected rows must share a reference to auto-assign.", "Imirongo yose igomba kugirana indango imwe kugirango ihuzwe byikora."));
      return;
    }
    const uniqueReferences = Array.from(new Set(references));
    if (uniqueReferences.length !== 1) {
      setBulkError(joinBilingual("Selected rows do not share the same reference.", "Imirongo mutoranyije nta indango imwe ifite."));
      return;
    }

    const sharedReference = uniqueReferences[0];
    const parts = sharedReference.split(".");
    if (parts.length < 3) {
      setBulkError(joinBilingual("Reference does not include an ikimina code.", "Indango ntiyerekana kode y'ikimina."));
      return;
    }

    const groupCode = parts[2];
    startTransition(async () => {
      setBulkMessage(null);
      setBulkError(null);
      try {
        let queryBuilder = supabase
          .from("ibimina")
          .select("id")
          .eq("code", groupCode)
          .eq("status", "ACTIVE");
        if (saccoId) {
          queryBuilder = queryBuilder.eq("sacco_id", saccoId);
        }
        const { data: group, error: groupError } = await queryBuilder.maybeSingle();
        type GroupRow = { id: string };
        const resolvedGroup = (group ?? null) as GroupRow | null;
        if (groupError || !resolvedGroup) {
          throw new Error(groupError?.message ?? "No matching ikimina found for reference");
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("payments")
          .update({ ikimina_id: resolvedGroup.id })
          .in("id", selectedIds);

        if (error) {
          throw error;
        }

        const count = selectedIds.length;
        const assignedEn = `Assigned ${count} payment(s) to ${groupCode}.`;
        const assignedRw = `Imisanzu ${count} yashyizwe kuri ${groupCode}.`;
        setBulkMessage(joinBilingual(assignedEn, assignedRw));
        toastSuccess(joinBilingual(`Assigned ${count} payment(s).`, `Imisanzu ${count} yashyizweho.`));
        setSelectedIds([]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to auto-assign";
        const bilingualMessage = joinBilingual(message, "Guhuza byikora byanze");
        setBulkError(bilingualMessage);
        toastError(bilingualMessage);
      }
    });
  };

  const handleClose = () => {
    setSelected(null);
    setActionMessage(null);
    setActionError(null);
    setNewStatus("POSTED");
  };

  const handleUpdateStatus = () => {
    if (!selected || !canWrite) return;
    startTransition(async () => {
      setActionMessage(null);
      setActionError(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("payments")
        .update({ status: newStatus })
        .eq("id", selected.id);
      if (error) {
        const message = error.message ?? "Failed to update status";
        setActionError(joinBilingual(message, "Guhindura imiterere byanze"));
        return;
      }
      const statusLabel = getStatusLabel(newStatus);
      setActionMessage(joinBilingual("Status updated. Refresh the page to see latest data.", "Imiterere yavuguruwe. Ongera usubize urupapuro."));
      toastSuccess(joinBilingual(`Status updated to ${statusLabel.primary}`, `Imiterere yahinduwe kuri ${statusLabel.secondary}`));
    });
  };

  const handleAssignToIkimina = async (ikiminaId: string, memberId: string | null = null) => {
    if (!selected || !canWrite) return;
    startTransition(async () => {
      setActionMessage(null);
      setActionError(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("payments")
        .update({ ikimina_id: ikiminaId, member_id: memberId })
        .eq("id", selected.id);
      if (error) {
        const message = error.message ?? "Failed to assign";
        setActionError(joinBilingual(message, "Guhuza byanze"));
        return;
      }
      setActionMessage(joinBilingual("Assigned to ikimina. Refresh to verify.", "Byahuye n'ikimina. Ongera usubize urupapuro."));
      toastSuccess(joinBilingual("Payment updated", "Imisanzu yavuguruwe"));
    });
  };

  const handleLinkMember = (member: MemberResult) => {
    if (!canWrite) return;
    handleAssignToIkimina(member.ikimina_id, member.id);
    setMemberQuery("");
    setMemberResults([]);
  };

  const applyAiSuggestion = (suggestion: {
    member_id: string;
    ikimina_id: string | null;
    confidence: number;
    reason: string;
    member_code?: string | null;
  }) => {
    if (!selected) return;
    const targetIkiminaId = suggestion.ikimina_id ?? selected.ikimina_id;
    if (!targetIkiminaId) {
      const bilingual = joinBilingual(
        "Suggestion missing ikimina. Assign a group manually.",
        "Icyifuzo ntigaragaza ikimina. Banza uhitemo itsinda."
      );
      setActionError(bilingual);
      toastError(bilingual);
      return;
    }
    if (!canWrite) {
      toastError(joinBilingual("Upgrade access to apply AI suggestions.", "Ongera uburenganzira kugira ngo ukoreshe icyifuzo."));
      return;
    }
    handleAssignToIkimina(targetIkiminaId, suggestion.member_id);
  };

  const refreshAiSuggestion = () => {
    if (!selected) return;
    suggestionCache.current.delete(selected.id);
    setAiStatus("idle");
    setAiError(null);
    setAiRefreshToken((token) => token + 1);
  };

  useEffect(() => {
    if (selected && !rowMap.has(selected.id)) {
      setSelected(null);
    }
  }, [rowMap, selected]);

  useEffect(() => {
    setMemberResults([]);
    setMemberLoading(false);

    if (!selected) {
      setMemberQuery("");
      return;
    }

    const cleanMsisdn = selected.msisdn && !selected.msisdn.includes("✱") ? selected.msisdn.replace(/[^0-9+]/g, "") : "";
    if (cleanMsisdn && cleanMsisdn.length >= 6) {
      setMemberQuery(cleanMsisdn);
      return;
    }

    const memberCode = selected.reference?.split(".")[3];
    setMemberQuery(memberCode ?? "");
  }, [selected, aiRefreshToken]);

  useEffect(() => {
    const term = memberQuery.trim();
    if (!canWrite) {
      setMemberResults([]);
      setMemberLoading(false);
      return;
    }

    if (!selected || term.length < 2) {
      setMemberResults([]);
      setMemberLoading(false);
      return;
    }

    let cancelled = false;
    setMemberLoading(true);
    const timeout = window.setTimeout(async () => {
      const sanitized = term.replace(/%/g, "");
      let query = supabase
        .from("ikimina_members_public")
        .select("id, full_name, member_code, msisdn, ikimina_id, ikimina_name, sacco_id")
        .order("full_name", { ascending: true })
        .limit(8);

      if (selected.ikimina_id) {
        query = query.eq("ikimina_id", selected.ikimina_id);
      } else if (saccoId) {
        query = query.eq("sacco_id", saccoId);
      }

      const like = `%${sanitized}%`;
      query = query.or(`full_name.ilike.${like},msisdn.ilike.${like},member_code.ilike.${like}`);

      const { data, error } = await query;

      if (cancelled) {
        return;
      }

      if (error) {
        const message = error.message ?? "Member search failed";
        toastError(joinBilingual(message, "Gushakisha abanyamuryango byanze"));
        setMemberResults([]);
      } else {
        type RawMember = {
          id: string;
          full_name: string;
          member_code: string | null;
          msisdn: string | null;
          ikimina_id: string;
          ikimina_name: string | null;
        };
        setMemberResults(
          (data as RawMember[] | null | undefined)?.map((member) => ({
            id: member.id,
            full_name: member.full_name,
            member_code: member.member_code,
            msisdn: member.msisdn,
            ikimina_id: member.ikimina_id,
            ikimina_name: member.ikimina_name ?? null,
          })) ?? []
        );
      }

      setMemberLoading(false);
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [memberQuery, selected, saccoId, toastError, canWrite]);

  useEffect(() => {
    if (!selected) {
      setAiSuggestion(null);
      setAiAlternatives([]);
      setAiStatus("idle");
      setAiError(null);
      return;
    }

    const cached = suggestionCache.current.get(selected.id);
    if (cached) {
      setAiSuggestion(cached.suggestion ?? null);
      setAiAlternatives(cached.alternatives ?? []);
      setAiStatus("ready");
      setAiError(null);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    setAiStatus("loading");
    setAiError(null);

    fetch("/api/reconciliation/suggest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentId: selected.id }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error ?? `Suggestion request failed (${response.status})`);
        }
        return response.json() as Promise<{
          suggestion: {
            member_id: string;
            ikimina_id: string | null;
            confidence: number;
            reason: string;
            member_code?: string | null;
          } | null;
          alternatives: Array<{
            member_id: string;
            ikimina_id: string | null;
            confidence: number;
            reason: string;
            member_code?: string | null;
          }>;
        }>;
      })
      .then((payload) => {
        if (cancelled) return;
        suggestionCache.current.set(selected.id, {
          suggestion: payload.suggestion ?? null,
          alternatives: payload.alternatives ?? [],
        });
        setAiSuggestion(payload.suggestion ?? null);
        setAiAlternatives(payload.alternatives ?? []);
        setAiStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("AI suggestion fetch error", err);
        const bilingual = joinBilingual(
          err instanceof Error ? err.message : "Suggestion lookup failed",
          "Gusaba inama byanze"
        );
        setAiError(bilingual);
        setAiStatus("error");
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selected]);

  const sharedReference = useMemo(() => {
    if (selectedIds.length === 0) return null;
    const references = selectedIds
      .map((id) => rowMap.get(id)?.reference ?? null)
      .filter((value): value is string => Boolean(value));
    if (references.length !== selectedIds.length) return null;
    const unique = new Set(references);
    return unique.size === 1 ? references[0] : null;
  }, [selectedIds, rowMap]);

  const recommendedQueries = useMemo(() => {
    if (!selected) return [] as Array<{ value: string; primary: string; secondary: string }>;
    const suggestions = new Map<string, { primary: string; secondary: string }>();

    const msisdn = selected.msisdn?.replace(/[^0-9+]/g, "");
    if (msisdn && !selected.msisdn?.includes("✱") && msisdn.length >= 6) {
      suggestions.set(msisdn, {
        primary: `Use MSISDN ${msisdn}`,
        secondary: `Koresha numero ${msisdn}`,
      });
    }

    const referenceParts = selected.reference?.split(".") ?? [];
    if (referenceParts.length >= 4) {
      const memberCode = referenceParts[3];
      if (memberCode) {
        suggestions.set(memberCode, {
          primary: `Member code ${memberCode}`,
          secondary: `Kode y'umunyamuryango ${memberCode}`,
        });
      }
    }

    if (selected.txn_id) {
      const shortTxn = selected.txn_id.slice(-8);
      suggestions.set(shortTxn, {
        primary: `Search txn ${shortTxn}`,
        secondary: `Shakisha ubwishyu ${shortTxn}`,
      });
    }

    return Array.from(suggestions.entries()).map(([value, label]) => ({ value, ...label }));
  }, [selected]);

  return (
    <div className="relative space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="w-full sm:w-64">
          <Input
            label="Search / Shakisha"
            placeholder="Reference, MSISDN, txn id / Indango, nimero cyangwa kode"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-2">
          <label htmlFor="status-filter">
            <BilingualText
              primary="Status"
              secondary="Imiterere"
              layout="inline"
              className="items-center gap-1"
              secondaryClassName="text-[10px] text-neutral-3"
            />
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs uppercase tracking-[0.3em] text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
          >
            <option value="ALL">All / Byose</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
            {joinBilingual(option, getStatusLabel(option).secondary.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => setShowDuplicatesOnly((value) => !value)}
          className={cn(
            "rounded-full px-4 py-2 text-xs uppercase tracking-[0.3em]",
            showDuplicatesOnly ? "bg-white/15 text-neutral-0" : "bg-white/5 text-neutral-2"
          )}
        >
          <BilingualText
            primary="Duplicates only"
            secondary="Byisubiyemo gusa"
            layout="inline"
            className="items-center gap-1"
            secondaryClassName="text-[10px] text-neutral-3"
          />
        </button>
        <button
          type="button"
          onClick={() => setShowLowConfidence((value) => !value)}
          className={cn(
            "rounded-full px-4 py-2 text-xs uppercase tracking-[0.3em]",
            showLowConfidence ? "bg-white/15 text-neutral-0" : "bg-white/5 text-neutral-2"
          )}
        >
          <BilingualText
            primary="Low confidence"
            secondary="Icyizere gito"
            layout="inline"
            className="items-center gap-1"
            secondaryClassName="text-[10px] text-neutral-3"
          />
        </button>
        <div className="flex flex-wrap gap-2">
          {reasonEntries.map((reason) => {
            const isActive = reasonFilters.includes(reason.id);
            return (
              <button
                key={reason.id}
                type="button"
                onClick={() =>
                  setReasonFilters((current) =>
                    current.includes(reason.id)
                      ? current.filter((item) => item !== reason.id)
                      : [...current, reason.id]
                  )
                }
                className={cn(
                  "rounded-full px-4 py-2 text-xs uppercase tracking-[0.3em]",
                  isActive ? "bg-white/15 text-neutral-0" : "bg-white/5 text-neutral-2"
                )}
              >
                <BilingualText
                  primary={reason.label.primary}
                  secondary={reason.label.secondary}
                  layout="inline"
                  className="items-center gap-2"
                  secondaryClassName="text-[10px] text-neutral-3"
                />
              </button>
            );
          })}
        </div>
      </div>

      {canWrite && selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-xs text-neutral-0">
          <span>{joinBilingual(`${selectedIds.length} selected`, `${selectedIds.length} byatoranyijwe`)}</span>
          <button
            type="button"
            onClick={() => handleBulkStatus("POSTED")}
            disabled={pending || !canWrite}
            className="interactive-scale rounded-full bg-kigali px-3 py-1 text-ink shadow-glass disabled:opacity-60"
          >
            <BilingualText
              primary="Mark posted"
              secondary="Shyira kuri byemejwe"
              layout="inline"
              className="items-center gap-1"
              secondaryClassName="text-[10px] text-neutral-3"
            />
          </button>
          <button
            type="button"
            onClick={() => handleBulkStatus("REJECTED")}
            disabled={pending || !canWrite}
            className="interactive-scale rounded-full border border-white/15 px-3 py-1 text-neutral-0 disabled:opacity-60"
          >
            <BilingualText
              primary="Reject"
              secondary="Byanzwe"
              layout="inline"
              className="items-center gap-1"
              secondaryClassName="text-[10px] text-neutral-3"
            />
          </button>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Ikimina UUID / Icyiciro"
              value={bulkIkiminaId}
              onChange={(event) => setBulkIkiminaId(event.target.value)}
              className="w-40 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-neutral-0 placeholder:text-neutral-3 focus:outline-none focus:ring-2 focus:ring-rw-blue"
              disabled={pending || !canWrite}
            />
            <button
              type="button"
              onClick={handleBulkAssign}
              disabled={pending || !bulkIkiminaId.trim() || !canWrite}
              className="interactive-scale rounded-full bg-white/15 px-3 py-1 text-neutral-0 disabled:opacity-60"
            >
              <BilingualText
                primary="Assign group"
                secondary="Huza n'ikimina"
                layout="inline"
                className="items-center gap-1"
                secondaryClassName="text-[10px] text-neutral-3"
              />
            </button>
          </div>
          {sharedReference && (
            <button
              type="button"
              onClick={handleBulkAssignByReference}
              disabled={pending}
              className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.3em] text-neutral-0"
            >
              <BilingualText
                primary="Assign via reference"
                secondary="Huza uko indango ibigaragaza"
                layout="inline"
                className="items-center gap-1"
                secondaryClassName="text-[10px] text-neutral-3"
              />
            </button>
          )}
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            disabled={!canWrite}
            className="text-neutral-2 hover:text-neutral-0 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <BilingualText
              primary="Clear"
              secondary="Siba"
              layout="inline"
              className="items-center gap-1"
              secondaryClassName="text-[10px] text-neutral-3"
            />
          </button>
          {bulkMessage && <span className="text-[11px] text-emerald-200">{bulkMessage}</span>}
          {bulkError && <span className="text-[11px] text-amber-200">{bulkError}</span>}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.2em] text-neutral-2">
            <tr>
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  aria-label="Select all"
                  onChange={toggleSelectAll}
                  disabled={!canWrite}
                  className="h-4 w-4 rounded border-white/30 bg-transparent disabled:cursor-not-allowed disabled:opacity-60"
                />
              </th>
              <th className="px-4 py-3">
                <BilingualText primary="Occurred" secondary="Igihe" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
              </th>
              <th className="px-4 py-3">
                <BilingualText primary="Amount" secondary="Amafaranga" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
              </th>
              <th className="px-4 py-3">
                <BilingualText primary="Reference" secondary="Indango" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
              </th>
              <th className="px-4 py-3">
                <BilingualText primary="MSISDN" secondary="Numero" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
              </th>
              <th className="px-4 py-3">
                <BilingualText primary="Reasons" secondary="Impamvu" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
              </th>
              <th className="px-4 py-3">
                <BilingualText primary="Status" secondary="Imiterere" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {displayRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-neutral-2">
                  {joinBilingual("No exceptions match your filters.", "Nta kibazo gihuye n'uburyo bwo muyunguruza." )}
                </td>
              </tr>
            )}
            {displayRows.map((row) => {
              const isRowSelected = selectedIds.includes(row.id);
              const reasons = deriveReasons(row);
              return (
                <tr
                  key={row.id}
                  className={cn(
                    "cursor-pointer transition hover:bg-white/5",
                    isRowSelected ? "bg-white/10" : undefined
                  )}
                  onClick={() => setSelected(row)}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isRowSelected}
                      aria-label="Select exception"
                      onClick={(event) => event.stopPropagation()}
                      onChange={() => toggleSelect(row.id)}
                      disabled={!canWrite}
                      className="h-4 w-4 rounded border-white/30 bg-transparent disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </td>
                  <td className="px-4 py-3 text-neutral-2">{new Date(row.occurred_at).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium">
                    {new Intl.NumberFormat("en-RW", { style: "currency", currency: row.currency ?? "RWF", maximumFractionDigits: 0 }).format(row.amount)}
                  </td>
                  <td className="px-4 py-3 text-neutral-2">{row.reference ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-2">{row.msisdn ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {reasons.length === 0 && <span className="text-[11px] text-neutral-2">—</span>}
                      {reasons.map((reason) => {
                        const guidance = reasonGuidance[reason.id];
                        const title = guidance ? joinBilingual(guidance.primary, guidance.secondary) : undefined;
                        return (
                          <span
                            key={reason.id}
                            className={cn(
                              "rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.2em]",
                              reason.tone === "critical" && "bg-red-500/20 text-red-200",
                              reason.tone === "warning" && "bg-amber-500/20 text-amber-200",
                              reason.tone === "info" && "bg-white/10 text-neutral-0"
                            )}
                            title={title}
                          >
                            <BilingualText
                              primary={reason.label.primary}
                              secondary={reason.label.secondary}
                              layout="inline"
                              className="items-center gap-1"
                              secondaryClassName="text-[10px] text-neutral-3"
                            />
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const label = getStatusLabel(row.status);
                      return (
                        <StatusChip tone={row.status === "UNALLOCATED" ? "critical" : row.status === "POSTED" || row.status === "SETTLED" ? "success" : "warning"}>
                          <BilingualText
                            primary={label.primary.toUpperCase()}
                            secondary={label.secondary.toUpperCase()}
                            layout="stack"
                            secondaryClassName="text-[9px] text-neutral-3"
                          />
                        </StatusChip>
                      );
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/40 backdrop-blur-sm">
          <aside className="relative flex h-full w-full max-w-md flex-col gap-6 overflow-y-auto bg-ink/95 p-6 shadow-2xl">
            <button
              type="button"
              className="interactive-scale absolute right-4 top-4 text-sm text-neutral-2 hover:text-neutral-0"
              onClick={handleClose}
            >
              <BilingualText
                primary="Close"
                secondary="Funga"
                layout="inline"
                className="items-center gap-1"
                secondaryClassName="text-[10px] text-neutral-3"
              />
              <span aria-hidden className="ml-1">✕</span>
            </button>
            <div className="pt-6 text-sm text-neutral-0">
              <h3 className="text-lg font-semibold">
                <BilingualText
                  primary="Transaction Details"
                  secondary="Ibisobanuro by'ubwishyu"
                  secondaryClassName="text-sm text-neutral-3"
                />
              </h3>
              <dl className="mt-3 space-y-2 text-xs text-neutral-2">
                <div>
                  <dt className="uppercase tracking-[0.2em]">
                    <BilingualText primary="Occurred" secondary="Igihe" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
                  </dt>
                  <dd>{new Date(selected.occurred_at).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-[0.2em]">
                    <BilingualText primary="Amount" secondary="Amafaranga" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
                  </dt>
                  <dd>
                    {new Intl.NumberFormat("en-RW", { style: "currency", currency: selected.currency ?? "RWF", maximumFractionDigits: 0 }).format(selected.amount)}
                  </dd>
                </div>
                <div>
                  <dt className="uppercase tracking-[0.2em]">
                    <BilingualText primary="Reference" secondary="Indango" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
                  </dt>
                  <dd>{selected.reference ?? "—"}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-[0.2em]">
                    <BilingualText primary="MSISDN" secondary="Numero" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
                  </dt>
                  <dd>{selected.msisdn ?? "—"}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-[0.2em]">
                    <BilingualText primary="Status" secondary="Imiterere" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
                  </dt>
                  <dd>
                    {(() => {
                      const label = getStatusLabel(selected.status);
                      return joinBilingual(selected.status, label.secondary.toUpperCase());
                    })()}
                  </dd>
                </div>
                <div>
                  <dt className="uppercase tracking-[0.2em]">
                    <BilingualText primary="Confidence" secondary="Icyizere" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
                  </dt>
                  <dd>{selected.confidence != null ? `${Math.round(selected.confidence * 100)}%` : "—"}</dd>
                </div>
                {selectedReasons.length > 0 && (
                  <div>
                    <dt className="uppercase tracking-[0.2em]">
                      <BilingualText primary="Reason tags" secondary="Impamvu" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
                    </dt>
                    <dd>
                      <div className="mt-1 flex flex-wrap gap-1">
                       {selectedReasons.map((reason) => (
                          <span
                            key={reason.id}
                            className={cn(
                              "rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.2em]",
                              reason.tone === "critical" && "bg-red-500/20 text-red-200",
                              reason.tone === "warning" && "bg-amber-500/20 text-amber-200",
                              reason.tone === "info" && "bg-white/10 text-neutral-0"
                            )}
                          >
                            <BilingualText
                              primary={reason.label.primary}
                              secondary={reason.label.secondary}
                              layout="inline"
                              className="items-center gap-1"
                              secondaryClassName="text-[10px] text-neutral-3"
                            />
                          </span>
                        ))}
                      </div>
                    </dd>
                  </div>
                )}
                {selectedReasons.length > 0 && (
                  <div>
                    <dt className="uppercase tracking-[0.2em]">
                      <BilingualText primary="Audit hints" secondary="Inama z'igenzura" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
                    </dt>
                    <dd>
                      <ul className="mt-2 space-y-2">
                        {selectedReasons.map((reason) => {
                          const guidance = reasonGuidance[reason.id];
                          if (!guidance) return null;
                          return (
                            <li key={`hint-${reason.id}`} className="rounded-xl bg-white/10 px-3 py-2 text-neutral-0">
                              {joinBilingual(guidance.primary, guidance.secondary)}
                            </li>
                          );
                        })}
                      </ul>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="space-y-3 text-sm text-neutral-0">
              <h4 className="font-semibold">Raw SMS</h4>
              <pre className="max-h-48 overflow-y-auto rounded-xl bg-black/40 p-4 text-xs text-neutral-2">
                {selected.source?.raw_text ?? joinBilingual("No SMS source", "Nta SMS iboneka")}
              </pre>
            </div>
            <div className="space-y-3 text-sm text-neutral-0">
              <h4 className="font-semibold">Parsed JSON</h4>
              <pre className="max-h-48 overflow-y-auto rounded-xl bg-black/40 p-4 text-xs text-neutral-2">
                {selected.source?.parsed_json
                  ? JSON.stringify(selected.source.parsed_json, null, 2)
                  : joinBilingual("No parser output", "Nta bisohoka mu gusobanura")}
              </pre>
            </div>

            <div className="space-y-3 text-sm text-neutral-0">
              <h4 className="font-semibold">Actions</h4>
              <div className="space-y-2 text-xs text-neutral-2">
                <label className="block uppercase tracking-[0.2em]">
                  <BilingualText primary="Update status" secondary="Hindura imiterere" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
                </label>
                <select
          value={newStatus}
          onChange={(event) => setNewStatus(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
        >
          {STATUS_OPTIONS.map((status) => {
            const label = getStatusLabel(status);
            return (
              <option key={status} value={status}>
                {joinBilingual(status, label.secondary.toUpperCase())}
              </option>
            );
          })}
        </select>
                <button
                  type="button"
                  onClick={handleUpdateStatus}
                  disabled={pending}
                  className="interactive-scale w-full rounded-xl bg-kigali py-2 text-xs font-semibold uppercase tracking-wide text-ink shadow-glass disabled:opacity-60"
                >
                  {pending ? joinBilingual("Saving…", "Kubika…") : joinBilingual("Save status", "Bika imiterere")}
                </button>
              </div>
              <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-neutral-2">
                <div className="flex items-center justify-between">
                  <span className="uppercase tracking-[0.2em] text-neutral-2">
                    <BilingualText primary="AI suggestion" secondary="Inama ya AI" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
                  </span>
                  <button
                    type="button"
                    onClick={refreshAiSuggestion}
                    className="text-[11px] text-neutral-2 underline-offset-2 hover:underline"
                  >
                    {joinBilingual("Retry", "Ongera")}
                  </button>
                </div>
                {aiStatus === "loading" && (
                  <p>{joinBilingual("Analyzing payment…", "Irasesengura ubwishyu…")}</p>
                )}
                {aiStatus === "error" && aiError && (
                  <p className="text-rose-300">{aiError}</p>
                )}
                {aiStatus === "ready" && aiSuggestion && (
                  <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-neutral-0">
                    <p className="font-semibold text-sm">
                      {joinBilingual("Suggested member", "Umugenerwa w'icyifuzo")}
                    </p>
                    <p className="text-xs text-neutral-2">{aiSuggestion.reason}</p>
                    <div className="flex items-center justify-between text-[11px] text-neutral-2">
                      <span>
                        {joinBilingual(
                          `Confidence ${Math.round(aiSuggestion.confidence * 100)}%`,
                          `Icyizere ${Math.round(aiSuggestion.confidence * 100)}%`
                        )}
                      </span>
                      {aiSuggestion.member_code && (
                        <span>
                          {joinBilingual(`Code ${aiSuggestion.member_code}`, `Kode ${aiSuggestion.member_code}`)}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => applyAiSuggestion(aiSuggestion)}
                      disabled={!canWrite}
                      className="w-full rounded-xl bg-kigali py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink shadow-glass disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {joinBilingual("Apply suggestion", "Kurikiza icyifuzo")}
                    </button>
                  </div>
                )}
                {aiStatus === "ready" && !aiSuggestion && (
                  <p>{joinBilingual("No confident suggestion. Review alternatives or assign manually.", "Nta cyizere gihagije. Reba amahitamo cyangwa uhuze intoki.")}</p>
                )}
                {aiStatus === "ready" && aiAlternatives.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-2">
                      {joinBilingual("Other options", "Andi mahitamo")}
                    </p>
                    <ul className="space-y-1">
                      {aiAlternatives.map((option) => (
                        <li key={`${option.member_id}-${option.reason}`} className="flex items-center justify-between gap-3 rounded-xl bg-black/15 px-3 py-2">
                          <div className="text-left text-[11px] text-neutral-0">
                            <p className="font-semibold">{joinBilingual(option.reason, option.reason)}</p>
                            <p className="text-neutral-2">
                              {joinBilingual(
                                `Confidence ${Math.round(option.confidence * 100)}%`,
                                `Icyizere ${Math.round(option.confidence * 100)}%`
                              )}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => applyAiSuggestion(option)}
                            disabled={!canWrite}
                            title={!canWrite ? joinBilingual("Read-only access", "Uburenganzira bwo gusoma gusa") : undefined}
                            className="rounded-full border border-white/15 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-neutral-0 hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {joinBilingual("Apply", "Shyiraho")}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="space-y-2 text-xs text-neutral-2">
                <label className="block uppercase tracking-[0.2em]">
                  <BilingualText primary="Assign to ikimina (ID)" secondary="Huza ku ikimina (ID)" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    className="flex-1 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
                    placeholder={joinBilingual("Paste ikimina UUID", "Shyiramo UUID y'ikimina")}
                    onBlur={(event) => {
                      const value = event.currentTarget.value.trim();
                      if (value) {
                        handleAssignToIkimina(value);
                        event.currentTarget.value = "";
                      }
                    }}
                  />
                  <span className="text-[10px] text-neutral-2">{joinBilingual("On blur to apply", "Bikora uhise ubisohokamo")}</span>
                </div>
              </div>
              <div className="space-y-2 text-xs text-neutral-2">
                <label className="block uppercase tracking-[0.2em]">
                  <BilingualText primary="Link to member" secondary="Huza ku munyamuryango" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
                </label>
                {recommendedQueries.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {recommendedQueries.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setMemberQuery(item.value)}
                        className="rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-neutral-0 hover:border-white/30"
                      >
                        <BilingualText
                          primary={item.primary}
                          secondary={item.secondary}
                          layout="inline"
                          className="items-center gap-1"
                          secondaryClassName="text-[9px] text-neutral-3"
                        />
                      </button>
                    ))}
                  </div>
                )}
                <input
                  type="search"
                  value={memberQuery}
                  onChange={(event) => setMemberQuery(event.target.value)}
                  placeholder={joinBilingual("Search by name, MSISDN, or code", "Shakisha izina, nimero, cyangwa kode")}
                  className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
                />
                {memberQuery.trim().length > 0 && memberQuery.trim().length < 2 && (
                  <p className="text-[10px] text-neutral-2">{joinBilingual("Type at least 2 characters.", "Andika byibura inyuguti 2.")}</p>
                )}
                {memberLoading && <p className="text-[10px] text-neutral-2">{joinBilingual("Searching…", "Birashakishwa…")}</p>}
                {!memberLoading && memberQuery.trim().length >= 2 && memberResults.length === 0 && (
                  <p className="text-[10px] text-neutral-2">{joinBilingual("No matches yet.", "Ntibiraboneka")}</p>
                )}
                {memberResults.length > 0 && (
                  <ul className="space-y-1">
                    {memberResults.map((member) => (
                      <li key={member.id}>
                        <button
                          type="button"
                          onClick={() => handleLinkMember(member)}
                          disabled={pending}
                          className="interactive-scale w-full rounded-xl bg-white/10 px-3 py-2 text-left text-neutral-0 disabled:opacity-60"
                        >
                          <span className="font-medium">{member.full_name}</span>
                          <span className="ml-2 text-[11px] uppercase tracking-[0.2em] text-neutral-2">
                            {member.member_code ?? joinBilingual("No code", "Nta kode")}
                          </span>
                          <div className="text-[11px] text-neutral-2">
                            {member.msisdn ?? joinBilingual("No MSISDN", "Nta nimero" )} · {member.ikimina_name ?? joinBilingual("Unknown ikimina", "Ikimina kitazwi")}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {actionError && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-300">{actionError}</p>}
              {actionMessage && <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">{actionMessage}</p>}
              <p className="text-[10px] text-neutral-2">
                SACCO scope: {saccoId ?? "System"}. Some actions may be limited by RLS policies.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
