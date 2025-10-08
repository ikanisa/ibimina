"use client";

import { useMemo, useState, useTransition } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/providers/toast-provider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DEFAULT_MEMBER_MASKS,
  getMaskOptions,
  processRow,
  type ProcessedCell,
  type ProcessedRow,
} from "@/lib/imports/validation";
import type { Database } from "@/lib/supabase/types";

const supabase = getSupabaseBrowserClient();

const MAX_PREVIEW_ROWS = 150;

interface MemberPdfImportDialogProps {
  ikiminaId: string;
  saccoId: string | null;
}

interface AiMemberRecord {
  full_name: string;
  msisdn: string | null;
  member_code: string | null;
}

type MemberInsert = Partial<Database["public"]["Tables"]["ikimina_members"]["Insert"]>;

type ProcessedMemberRow = ProcessedRow<MemberInsert> & { index: number };

export function MemberPdfImportDialog({ ikiminaId, saccoId }: MemberPdfImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [records, setRecords] = useState<AiMemberRecord[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [masks, setMasks] = useState({ ...DEFAULT_MEMBER_MASKS });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { success, error: toastError } = useToast();

  const toBilingual = (en: string, rw: string) => `${en} / ${rw}`;

  const processedRows = useMemo<ProcessedMemberRow[]>(() => {
    if (records.length === 0) return [];
    const fieldConfigs = [
      { key: "full_name" as const, maskId: masks.full_name, columnKey: "full_name" },
      { key: "msisdn" as const, maskId: masks.msisdn, columnKey: "msisdn" },
      { key: "member_code" as const, maskId: masks.member_code, columnKey: "member_code" },
    ];

    return records.map((record, index) => {
      const rowData: Record<string, string | null> = {
        full_name: record.full_name ?? "",
        msisdn: record.msisdn ?? "",
        member_code: record.member_code ?? "",
      };

      return Object.assign(
        processRow(fieldConfigs, rowData, (entries) => ({
          full_name: entries.full_name.value?.toString() ?? "",
          msisdn: entries.msisdn.value?.toString() ?? "",
          member_code: (entries.member_code.value ?? null) as string | null,
        })),
        { index }
      );
    });
  }, [records, masks]);

  const validRows = useMemo(() => processedRows.filter((row) => row.errors.length === 0), [processedRows]);
  const invalidRows = useMemo(() => processedRows.filter((row) => row.errors.length > 0), [processedRows]);

  const reset = () => {
    setOpen(false);
    setStep(1);
    setRecords([]);
    setWarnings([]);
    setMasks({ ...DEFAULT_MEMBER_MASKS });
    setFileName(null);
    setError(null);
    setMessage(null);
    setLoading(false);
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    setLoading(true);
    setError(null);
    setMessage(null);
    setWarnings([]);

    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch(`/api/ikimina/${ikiminaId}/member-ocr`, {
        method: "POST",
        body: form,
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? `OCR request failed (${response.status})`);
      }
      const payload = (await response.json()) as { members: AiMemberRecord[]; warnings?: string[] };
      const sanitized = (payload.members ?? []).map((member) => ({
        full_name: member.full_name?.trim() ?? "",
        msisdn: member.msisdn?.trim() || null,
        member_code: member.member_code?.trim() || null,
      }));

      if (sanitized.length === 0) {
        throw new Error("The PDF did not contain any members");
      }

      if (sanitized.length > 300) {
        throw new Error("The extracted list is too large. Split the PDF and try again.");
      }

      setRecords(sanitized);
      setWarnings(payload.warnings ?? []);
      setStep(2);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to process PDF";
      const bilingual = toBilingual(message, "Gucapa PDF byanze");
      setError(bilingual);
      toastError(bilingual);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRecord = (index: number, field: keyof AiMemberRecord, value: string) => {
    setRecords((current) => {
      const clone = [...current];
      const record = { ...clone[index] };
      if (field === "full_name") {
        record.full_name = value;
      } else if (field === "msisdn") {
        record.msisdn = value ? value : null;
      } else if (field === "member_code") {
        record.member_code = value ? value : null;
      }
      clone[index] = record;
      return clone;
    });
  };

  const handleDeleteRecord = (index: number) => {
    setRecords((current) => current.filter((_, idx) => idx !== index));
  };

  const handleAddRecord = () => {
    setRecords((current) => [...current, { full_name: "", msisdn: null, member_code: null }]);
  };

  const handleImport = () => {
    if (records.length === 0) {
      const messageEn = "Add at least one member before importing.";
      const bilingual = toBilingual(messageEn, "Ongeramo nibura umunyamuryango umwe imbere yo kwinjiza.");
      setError(bilingual);
      toastError(bilingual);
      return;
    }

    if (invalidRows.length > 0) {
      const messageEn = "Resolve highlighted validation issues before importing.";
      const bilingual = toBilingual(messageEn, "Banze amakosa agaragara mbere yo kwinjiza.");
      setError(bilingual);
      toastError(bilingual);
      return;
    }

    startTransition(async () => {
      try {
        setError(null);
        setMessage(null);

        const payload = validRows.map((row) => ({
          ikimina_id: ikiminaId,
          full_name: row.record.full_name ?? "",
          msisdn: row.record.msisdn ?? "",
          member_code: row.record.member_code ?? null,
        }));

        const { error: fnError } = await supabase.functions.invoke("secure-import-members", {
          body: {
            ikiminaId,
            saccoId,
            rows: payload,
          },
        });

        if (fnError) {
          throw new Error(fnError.message ?? "Import failed");
        }

        const successEn = `Imported ${payload.length} member(s). Refresh to verify counts.`;
        const successRw = `Byinjije abanyamuryango ${payload.length}. Ongera usubize urupapuro.`;
        const bilingual = toBilingual(successEn, successRw);
        setMessage(bilingual);
        success(bilingual);
        setRecords(payload.map((row) => ({
          full_name: row.full_name,
          msisdn: row.msisdn,
          member_code: row.member_code,
        })));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Import failed";
        const bilingual = toBilingual(message, "Kwinjiza byanze");
        setError(bilingual);
        toastError(bilingual);
      }
    });
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="interactive-scale rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-neutral-0 shadow-glass"
      >
        AI PDF import
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass relative w-full max-w-3xl rounded-3xl p-6 text-neutral-0">
            {loading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-3xl bg-black/40">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            )}
            <header className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-2">AI member import</p>
                <h2 className="text-lg font-semibold">{step === 1 ? "Upload PDF" : "Review & edit"}</h2>
                {fileName && <p className="text-xs text-neutral-2">{fileName}</p>}
              </div>
              <button className="text-sm text-neutral-2 hover:text-neutral-0" onClick={reset}>
                Close ✕
              </button>
            </header>

            {step === 1 && (
              <div className="mt-6 space-y-4 text-sm text-neutral-0">
                <p>Upload a scanned or digital PDF containing ikimina member lists. The AI will extract rows for review.</p>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/30 bg-white/5 p-10 text-center transition hover:bg-white/10">
                  <span className="text-sm font-semibold">Drop PDF here or click to browse</span>
                  <span className="text-xs text-neutral-2">Supported: .pdf (max 8MB)</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(event) => handleFile(event.target.files?.[0])}
                  />
                </label>
                <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  The PDF is processed with OpenAI OCR. Member data is reviewed locally before saving.
                </p>
                {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
              </div>
            )}

            {step === 2 && (
              <div className="mt-6 space-y-4 text-sm text-neutral-0">
                {warnings.length > 0 && (
                  <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
                    <p className="font-semibold">Model warnings</p>
                    <ul className="mt-2 list-disc space-y-1 pl-4">
                      {warnings.map((warning, idx) => (
                        <li key={`${warning}-${idx}`}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 text-xs text-neutral-2">
                  <label>
                    Validation mask · Full name
                    <select
                      value={masks.full_name}
                      onChange={(event) =>
                        setMasks((current) => ({ ...current, full_name: event.target.value }))
                      }
                      className="ml-2 rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-neutral-0"
                    >
                      {getMaskOptions("full_name").map((mask) => (
                        <option key={mask.id} value={mask.id}>
                          {mask.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Validation mask · MSISDN
                    <select
                      value={masks.msisdn}
                      onChange={(event) =>
                        setMasks((current) => ({ ...current, msisdn: event.target.value }))
                      }
                      className="ml-2 rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-neutral-0"
                    >
                      {getMaskOptions("msisdn").map((mask) => (
                        <option key={mask.id} value={mask.id}>
                          {mask.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Validation mask · Member code
                    <select
                      value={masks.member_code}
                      onChange={(event) =>
                        setMasks((current) => ({ ...current, member_code: event.target.value }))
                      }
                      className="ml-2 rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-neutral-0"
                    >
                      {getMaskOptions("member_code").map((mask) => (
                        <option key={mask.id} value={mask.id}>
                          {mask.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="max-h-[360px] overflow-auto rounded-2xl border border-white/10">
                  <table className="w-full border-collapse text-xs">
                    <thead className="bg-white/5 text-left uppercase tracking-[0.2em] text-neutral-2">
                      <tr>
                        <th className="px-4 py-2">Full name</th>
                        <th className="px-4 py-2">MSISDN</th>
                        <th className="px-4 py-2">Member code</th>
                        <th className="px-4 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {processedRows.slice(0, MAX_PREVIEW_ROWS).map((row) => {
                        const fullNameCell = row.cells.full_name as ProcessedCell;
                        const msisdnCell = row.cells.msisdn as ProcessedCell;
                        const memberCodeCell = row.cells.member_code as ProcessedCell;
                        const invalid = row.errors.length > 0;
                        return (
                          <tr key={`row-${row.index}`} className={invalid ? "bg-red-500/10" : undefined}>
                            <td className="px-4 py-2">
                              <input
                                value={records[row.index]?.full_name ?? ""}
                                onChange={(event) => handleUpdateRecord(row.index, "full_name", event.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-xs text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
                              />
                              {!fullNameCell?.valid && fullNameCell?.reason && (
                                <p className="mt-1 text-[10px] text-amber-200">{fullNameCell.reason}</p>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <input
                                value={records[row.index]?.msisdn ?? ""}
                                onChange={(event) => handleUpdateRecord(row.index, "msisdn", event.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-xs text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
                                placeholder="07########"
                              />
                              {!msisdnCell?.valid && msisdnCell?.reason && (
                                <p className="mt-1 text-[10px] text-amber-200">{msisdnCell.reason}</p>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <input
                                value={records[row.index]?.member_code ?? ""}
                                onChange={(event) => handleUpdateRecord(row.index, "member_code", event.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-xs text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
                                placeholder="Optional"
                              />
                              {!memberCodeCell?.valid && memberCodeCell?.reason && (
                                <p className="mt-1 text-[10px] text-amber-200">{memberCodeCell.reason}</p>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <button
                                type="button"
                                onClick={() => handleDeleteRecord(row.index)}
                                className="text-[11px] text-rose-300 underline-offset-2 hover:underline"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {processedRows.length > MAX_PREVIEW_ROWS && (
                        <tr>
                          <td colSpan={4} className="px-4 py-2 text-center text-[11px] text-neutral-2">
                            Showing first {MAX_PREVIEW_ROWS} rows. {processedRows.length - MAX_PREVIEW_ROWS} additional row(s) hidden.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-2">
                  <div>
                    Valid rows: {validRows.length} / {processedRows.length}
                    {invalidRows.length > 0 && <span className="ml-2 text-amber-200">Resolve {invalidRows.length} issue(s)</span>}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRecord}
                    className="rounded-xl border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-neutral-2"
                  >
                    Add row
                  </button>
                </div>

                <div className="flex flex-col gap-2 text-right text-xs text-neutral-2">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-xl border border-white/10 px-4 py-2 uppercase tracking-[0.3em] text-neutral-2"
                      onClick={() => setStep(1)}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleImport}
                      disabled={pending || validRows.length === 0}
                      className="rounded-xl bg-kigali px-4 py-2 uppercase tracking-[0.3em] text-ink shadow-glass disabled:opacity-60"
                    >
                      {pending ? "Importing…" : "Confirm import"}
                    </button>
                  </div>
                  {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
                  {message && <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">{message}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
