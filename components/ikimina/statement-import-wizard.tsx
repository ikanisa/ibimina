"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useToast } from "@/providers/toast-provider";
import { useConfirmDialog } from "@/providers/confirm-provider";
import {
  DEFAULT_STATEMENT_MASKS,
  getMaskOptions,
  processRow,
  type ProcessedCell,
  type ProcessedRow,
} from "@/lib/imports/validation";
import { parseTabularFile } from "@/lib/imports/file-parser";
import { Skeleton } from "@/components/ui/skeleton";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/providers/i18n-provider";

const REQUIRED_FIELDS = [
  { key: "occurredAt", label: "Occurred at", hint: "ISO date or 2024-09-01 08:53" },
  { key: "txnId", label: "Transaction ID", hint: "Unique statement reference" },
  { key: "msisdn", label: "MSISDN", hint: "07########" },
  { key: "amount", label: "Amount", hint: "Positive number" },
] as const satisfies ReadonlyArray<{
  key: "occurredAt" | "txnId" | "msisdn" | "amount";
  label: string;
  hint: string;
}>;

const OPTIONAL_FIELDS = [
  { key: "reference", label: "Reference", hint: "DISTRICT.SACCO.IKIMINA(.MEMBER)" },
] as const satisfies ReadonlyArray<{
  key: "reference";
  label: string;
  hint: string;
}>;

interface StatementImportWizardProps {
  saccoId: string;
  ikiminaId?: string;
  variant?: StatementWizardVariant;
  canImport?: boolean;
  disabledReason?: string;
}

type CsvRow = Record<string, string | null>;

type Mapping = Record<string, string>;

type StatementRow = {
  occurredAt: string;
  txnId: string;
  msisdn: string;
  amount: number;
  reference?: string | null;
};

type StatementWizardVariant = "generic" | "momo";

type ImportMode = "file" | "sms";

const createInitialStatementMasks = (variant: StatementWizardVariant) =>
  variant === "momo"
    ? { ...DEFAULT_STATEMENT_MASKS, occurredAt: "day-first" }
    : { ...DEFAULT_STATEMENT_MASKS };

type ImportResult = {
  inserted: number;
  duplicates: number;
  posted: number;
  unallocated: number;
  clientDuplicates?: number;
  rowCount?: number;
};

export function StatementImportWizard({ saccoId, ikiminaId, variant = "generic", canImport = true, disabledReason }: StatementImportWizardProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [importMode, setImportMode] = useState<ImportMode>("file");
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [masks, setMasks] = useState(() => createInitialStatementMasks(variant));
  const [parsing, setParsing] = useState(false);
  const [smsInput, setSmsInput] = useState("");
  const [smsParsing, setSmsParsing] = useState(false);
  const [smsError, setSmsError] = useState<string | null>(null);
  useEffect(() => {
    setMasks(createInitialStatementMasks(variant));
  }, [variant]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const handleMappingChange = useCallback(
    (fieldKey: string, column: string) => {
      setError(null);
      setMapping((current) => {
        const next = { ...current };
        for (const [key, value] of Object.entries(next)) {
          if (key !== fieldKey && value === column) {
            delete next[key];
          }
        }
        if (!column) {
          delete next[fieldKey];
        } else {
          next[fieldKey] = column;
        }
        return next;
      });
    },
    [],
  );
  const { success, error: toastError } = useToast();

  const toBilingual = (english: string, kinyarwanda: string) => `${english} / ${kinyarwanda}`;

  const notifyError = (english: string, kinyarwanda: string) => {
    toastError(toBilingual(english, kinyarwanda));
  };

  const notifySuccess = (english: string, kinyarwanda: string) => {
    success(toBilingual(english, kinyarwanda));
  };
  const confirmDialog = useConfirmDialog();
  const mappingComplete = useMemo(
    () => REQUIRED_FIELDS.every((field) => Boolean(mapping[field.key])),
    [mapping]
  );
  const amountFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-RW", {
        style: "currency",
        currency: "RWF",
        maximumFractionDigits: 0,
      }),
    []
  );

  const processedRows = useMemo<Array<ProcessedRow<StatementRow> & { index: number }>>(() => {
    if (rows.length === 0 || !mappingComplete) {
      return [];
    }

    return rows.map((row, index) => {
      const fieldConfigs = [
        ...REQUIRED_FIELDS.map((field) => ({
          key: field.key,
          maskId: masks[field.key],
          columnKey: mapping[field.key] ?? null,
        })),
        ...OPTIONAL_FIELDS.map((field) => ({
          key: field.key,
          maskId: masks[field.key],
          columnKey: mapping[field.key] ?? null,
        })),
      ];

      const processed = processRow(fieldConfigs, row, (entries) => {
        const occurredAtValue = entries.occurredAt?.value;
        const txnValue = entries.txnId?.value;
        const msisdnValue = entries.msisdn?.value;
        const amountValue = entries.amount?.value;
        const referenceValue = entries.reference?.value ?? null;

        return {
          occurredAt: occurredAtValue ? occurredAtValue.toString() : "",
          txnId: txnValue ? txnValue.toString() : "",
          msisdn: msisdnValue ? msisdnValue.toString() : "",
          amount:
            typeof amountValue === "number"
              ? amountValue
              : Number(amountValue ?? 0),
          reference:
            referenceValue === null || referenceValue === ""
              ? null
              : referenceValue.toString(),
        } satisfies StatementRow;
      });

      return { ...processed, index };
    });
  }, [rows, mapping, masks, mappingComplete]);

  const validRows = useMemo(() => processedRows.filter((row) => row.errors.length === 0), [processedRows]);

  const invalidRows = useMemo(() => processedRows.filter((row) => row.errors.length > 0), [processedRows]);

  const parserFeedback = useMemo(() => {
    const txnCounter = new Map<string, number>();
    let missingReference = 0;
    let autoMatch = 0;
    let invalidMsisdn = 0;
    let invalidDate = 0;

    for (const row of processedRows) {
      if (row.record.txnId) {
        txnCounter.set(row.record.txnId, (txnCounter.get(row.record.txnId) ?? 0) + 1);
      }

      if (!row.record.reference) {
        missingReference += 1;
      } else if (row.record.reference.split(".").filter(Boolean).length >= 3) {
        autoMatch += 1;
      }

      if (row.cells.msisdn && !row.cells.msisdn.valid) {
        invalidMsisdn += 1;
      }

      if (row.cells.occurredAt && !row.cells.occurredAt.valid) {
        invalidDate += 1;
      }
    }

    const duplicateTxnIds = new Set<string>();
    txnCounter.forEach((count, txnId) => {
      if (count > 1) {
        duplicateTxnIds.add(txnId);
      }
    });

    const duplicateRows = processedRows.filter((row) => duplicateTxnIds.has(row.record.txnId)).length;

    return {
      total: processedRows.length,
      duplicates: duplicateTxnIds.size,
      duplicateRows,
      duplicateTxnIds,
      missingReference,
      autoMatch,
      invalidMsisdn,
      invalidDate,
    };
  }, [processedRows]);

  const reset = () => {
    setOpen(false);
    setStep(1);
    setImportMode("file");
    setResult(null);
    setMessage(null);
    setError(null);
    setFileName(null);
    setHeaders([]);
    setRows([]);
    setMapping({});
    setMasks(createInitialStatementMasks(variant));
    setSmsInput("\n");
    setSmsError(null);
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    setMessage(null);
    setError(null);
    setParsing(true);
    setFileName(file.name);
    setMasks(createInitialStatementMasks(variant));
    try {
      const { headers: nextHeaders, rows: nextRows } = await parseTabularFile(file);
      setHeaders(nextHeaders);
      setRows(nextRows);
      const autoMap: Mapping = {};
      for (const field of nextHeaders) {
        const lower = field.toLowerCase();
        if (lower.includes("date") || lower.includes("occur")) autoMap.occurredAt = autoMap.occurredAt ?? field;
        if (lower.includes("txn") || lower.includes("id")) autoMap.txnId = autoMap.txnId ?? field;
        if ((lower.includes("msisdn") || lower.includes("phone")) && !autoMap.msisdn) autoMap.msisdn = field;
        if ((lower.includes("amount") || lower.includes("amt")) && !autoMap.amount) autoMap.amount = field;
        if ((lower.includes("reference") || lower.includes("ref")) && !autoMap.reference) autoMap.reference = field;
      }
      setMapping(autoMap);
      setStep(2);
    } catch (parseError) {
      const msg = parseError instanceof Error ? parseError.message : "Failed to parse file";
      setError(toBilingual(msg, "Kwinjiza byanze"));
      notifyError(msg, "Kwinjiza byanze");
    } finally {
      setParsing(false);
    }
  };

  const handleSmsParse = async () => {
    const trimmed = smsInput
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (trimmed.length === 0) {
      setSmsError(toBilingual("Paste one or more SMS messages first.", "Banza ushyiremo ubutumwa bwa SMS"));
      return;
    }

    setSmsError(null);
    setSmsParsing(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/imports/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saccoId,
          entries: trimmed.map((rawText) => ({ rawText })),
        }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
        results?: Array<{
          parsed: {
            txnId: string;
            occurredAt: string;
            msisdn: string;
            amount: number;
            reference?: string | null;
          } | null;
        }>;
        summary?: { errors?: number };
      };

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? "Unable to parse SMS messages");
      }

      const parsedResults = (payload.results ?? []).filter((item) => item.parsed);

      if (parsedResults.length === 0) {
        setSmsError(toBilingual("No SMS messages were parsed.", "Nta SMS yasobanutse"));
        setSmsParsing(false);
        return;
      }

      const rowsFromSms: CsvRow[] = parsedResults.map((item) => ({
        occurredAt: item.parsed!.occurredAt,
        txnId: item.parsed!.txnId,
        msisdn: item.parsed!.msisdn,
        amount: String(item.parsed!.amount),
        reference: item.parsed!.reference ?? "",
      }));

      setHeaders(["occurredAt", "txnId", "msisdn", "amount", "reference"]);
      setRows(rowsFromSms);
      setMapping({
        occurredAt: "occurredAt",
        txnId: "txnId",
        msisdn: "msisdn",
        amount: "amount",
        reference: "reference",
      });
      setMasks(createInitialStatementMasks(variant));
      setStep(2);

      if (payload.summary?.errors && payload.summary.errors > 0) {
        setSmsError(
          toBilingual(
            `${payload.summary.errors} message(s) could not be parsed.`,
            `${payload.summary.errors} ubutumwa ntibwashoboye gusesengurwa.`,
          ),
        );
      } else {
        setSmsError(null);
      }
    } catch (smsError) {
      console.error("Failed to parse SMS batch", smsError);
      setSmsError(toBilingual("Unable to parse one or more SMS messages.", "Gusesengura SMS byanze"));
      setSmsParsing(false);
      return;
    }

    setSmsParsing(false);
  };

  const handleConfirm = async () => {
    const accepted = await confirmDialog({
      title: "Confirm statement import",
      description: toBilingual(
        `Import ${validRows.length} valid row(s) for reconciliation? (${processedRows.length} total)`,
        `Kwinjiza imirongo ${validRows.length} yo guhuza (${processedRows.length} yose)`
      ),
      confirmLabel: "Import",
      cancelLabel: "Cancel",
    });

    if (!accepted) return;

    startTransition(async () => {
      try {
        setMessage(null);
        setError(null);
        const payload = validRows.map((row) => {
          const occurredAtSource = row.record.occurredAt;
          let occurredAt = occurredAtSource;
          try {
            occurredAt = new Date(occurredAtSource).toISOString();
          } catch (parseError) {
            console.warn("Falling back to raw occurredAt", parseError);
          }
          return {
            occurredAt,
            txnId: row.record.txnId,
            msisdn: row.record.msisdn,
            amount: row.record.amount,
            reference: row.record.reference,
          } satisfies StatementRow;
        });

        const response = await fetch("/api/imports/statement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            saccoId,
            ikiminaId,
            rows: payload,
          }),
        });

        const resultPayload = (await response.json()) as (ImportResult & { success?: boolean; error?: string }) | null;

        if (!response.ok || !resultPayload?.success) {
          throw new Error(resultPayload?.error ?? "Import failed");
        }

        setResult(resultPayload);
        const inserted = resultPayload.inserted ?? payload.length;
        const posted = resultPayload.posted ?? 0;
        const unallocated = resultPayload.unallocated ?? 0;
        const duplicates = resultPayload.duplicates ?? 0;
        setMessage(
          toBilingual(
            `Imported ${inserted} of ${processedRows.length} row(s) · ${posted} posted · ${unallocated} unallocated · ${duplicates} duplicates.`,
            `Byinjije imirongo ${inserted} muri ${processedRows.length} · ${posted} byemejwe · ${unallocated} bitaragabanywa · ${duplicates} byisubiyemo.`
          )
        );
        notifySuccess("Statement import complete", "Kwinjiza raporo byarangiye");
        setStep(3);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Import failed";
        console.error(err);
        setError(toBilingual(message, "Kwinjiza byanze"));
        notifyError(message, "Kwinjiza byanze");
      }
    });
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        onClick={() => {
          if (!canImport) return;
          setOpen(true);
        }}
        disabled={!canImport}
        title={!canImport ? disabledReason ?? "Read-only access" : undefined}
        className="w-full sm:w-auto"
      >
        {t("statement.trigger", "Import statements")}
      </Button>

      {open && canImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass relative w-full max-w-2xl rounded-3xl p-6 text-neutral-0">
            {(parsing || smsParsing) && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-3xl bg-black/40">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            )}
            <header className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-2">Statement import</p>
                <h2 className="text-lg font-semibold">Step {step} · {fileName ?? "Upload"}</h2>
              </div>
              <button className="text-sm text-neutral-2 hover:text-neutral-0" onClick={reset}>
                <span>{t("common.close", "Close")}</span>
                <span aria-hidden className="ml-1">✕</span>
              </button>
            </header>

            {step === 1 && (
              <div className="mt-6 space-y-4 text-sm text-neutral-0">
                <SegmentedControl
                  value={importMode}
                  onValueChange={(next) => {
                    if (typeof next !== "string") return;
                    setImportMode(next as ImportMode);
                  }}
                  options={[
                    {
                      value: "file",
                      label: t("statement.mode.file", "Upload file"),
                      description: t("statement.mode.fileHint", "CSV or Excel export"),
                    },
                    {
                      value: "sms",
                      label: t("statement.mode.sms", "Paste SMS"),
                      description: t("statement.mode.smsHint", "MTN MoMo notifications"),
                    },
                  ]}
                  columns={2}
                  aria-label={t("statement.mode.label", "Choose import mode")}
                />

                {importMode === "file" ? (
                  <>
                    <p>{t("statement.upload.intro", "Upload bank or MoMo statements exported as CSV or Excel. Include a header row.")}</p>
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/30 bg-white/5 p-10 text-center transition hover:bg-white/10">
                      <span className="text-sm font-semibold">{t("statement.upload.dropCta", "Drop file here or click to browse")}</span>
                      <span className="text-xs text-neutral-2">{t("statement.upload.supported", "Supported: .csv, .xlsx")}</span>
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls,.xlsm,.xlsb"
                        className="hidden"
                        onChange={(event) => handleFile(event.target.files?.[0])}
                      />
                    </label>
                    {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
                    <p className="text-xs text-neutral-2">{t("statement.upload.requiredCols", "Required columns: date, transaction id, amount, msisdn. Optional: reference.")}</p>
                  </>
                ) : (
                  <>
                    <p>{t("statement.sms.intro", "Paste one or more MoMo SMS messages. Each line should be a full SMS.")}</p>
                    <textarea
                      value={smsInput}
                      onChange={(event) => setSmsInput(event.target.value)}
                      rows={6}
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
                      placeholder="You have received RWF 15,000 from 078xxxxxxx (John Doe). Ref: ..."
                    />
                    {smsError && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{smsError}</p>}
                    <div className="flex justify-end">
                      <Button type="button" onClick={handleSmsParse} size="sm">
                        {t("statement.sms.parse", "Parse SMS")}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="mt-6 space-y-4 text-sm text-neutral-0">
                <p>{t("statement.map.intro", "Assign each required field to a column using the selectors below.")}</p>
                <div className="flex flex-wrap gap-2 text-[11px] text-neutral-2">
                  <span className="rounded-full bg-white/5 px-3 py-1">
                    {t("statement.map.columnsAvailable", "Columns detected:")} {headers.length}
                  </span>
                  <span className="rounded-full bg-white/5 px-3 py-1">
                    {t("statement.map.assigned", "Assigned:")} {Object.keys(mapping).length}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-2">
                  {t(
                    "statement.map.keyboard",
                    "Use arrow keys and enter to choose columns. Each column may only be assigned once.",
                  )}
                </p>
                {[...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].map((field) => {
                  const assigned = mapping[field.key] ?? "";
                  const maskOptions = getMaskOptions(field.key);
                  const selectedMask = masks[field.key];
                  const activeMask = maskOptions.find((mask) => mask.id === selectedMask);
                  return (
                    <div key={field.key} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <label className="flex flex-1 flex-col gap-2 text-sm text-neutral-0">
                          <span className="text-xs uppercase tracking-[0.3em] text-neutral-2">{field.label}</span>
                          <select
                            value={assigned}
                            onChange={(event) => handleMappingChange(field.key, event.target.value)}
                            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
                          >
                            <option value="">{t("statement.map.choose", "Choose column")}</option>
                            {headers.map((header) => (
                              <option key={header} value={header}>
                                {header}
                              </option>
                            ))}
                          </select>
                        </label>
                        {assigned && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMappingChange(field.key, "")}
                          >
                            {t("common.clear", "Clear")}
                          </Button>
                        )}
                      </div>
                      {maskOptions.length > 0 && (
                        <div className="flex items-center justify-between gap-3 text-[11px] text-neutral-2">
                          <span>{t("statement.map.validationMask", "Validation mask")}</span>
                          <select
                            value={selectedMask}
                            onChange={(event) =>
                              setMasks((current) => ({
                                ...current,
                                [field.key]: event.target.value,
                              }))
                            }
                            className="rounded-xl border border-white/10 bg-white/10 px-3 py-1 text-xs text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
                          >
                            {maskOptions.map((mask) => (
                              <option key={mask.id} value={mask.id}>
                                {mask.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <p className="text-[11px] text-neutral-2">{field.hint}</p>
                      {activeMask?.description && (
                        <p className="text-[10px] text-neutral-2">{activeMask.description}</p>
                      )}
                    </div>
                  );
                })}
                <div className="flex justify-end gap-2">
                  <button className="interactive-scale rounded-xl border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-neutral-2" onClick={() => setStep(1)}>
                    {t("common.back", "Back")}
                  </button>
                  <button
                    className="interactive-scale rounded-xl bg-kigali px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink shadow-glass disabled:opacity-60"
                    disabled={!mappingComplete}
                    onClick={() => {
                      if (!mappingComplete) {
                        const msg = "Map all required fields before continuing.";
                        setError(toBilingual(msg, "Shyira ahakwiye imirongo yose ibisabwa mbere yo gukomeza."));
                        notifyError(msg, "Shyira ahakwiye imirongo yose ibisabwa mbere yo gukomeza.");
                        return;
                      }
                      setError(null);
                      setStep(3);
                    }}
                  >
                    {t("common.review", "Review")}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="mt-6 space-y-4 text-sm text-neutral-0">
                <p>{t("statement.preview.intro", "Preview the first rows. Invalid entries are highlighted.")}</p>
                <div className="flex flex-wrap gap-2 text-xs text-neutral-2">
                  <span className="rounded-full bg-white/5 px-3 py-1">{t("statement.preview.autoMatch", "Likely auto-match:")} {parserFeedback.autoMatch}</span>
                  <span className="rounded-full bg-white/5 px-3 py-1">{t("statement.preview.duplicateRows", "Duplicate rows:")} {parserFeedback.duplicateRows}</span>
                  <span className="rounded-full bg-white/5 px-3 py-1">{t("statement.preview.missingRef", "Missing references:")} {parserFeedback.missingReference}</span>
                  <span className="rounded-full bg-white/5 px-3 py-1">{t("statement.preview.invalidMsisdn", "Invalid MSISDN:")} {parserFeedback.invalidMsisdn}</span>
                  <span className="rounded-full bg-white/5 px-3 py-1">{t("statement.preview.invalidDates", "Invalid dates:")} {parserFeedback.invalidDate}</span>
                </div>
                <div className="max-h-64 overflow-auto rounded-2xl border border-white/10">
                  <table className="w-full border-collapse text-xs">
                    <thead className="bg-white/5 text-left uppercase tracking-[0.2em] text-neutral-2">
                      <tr>
                        <th className="px-4 py-2">Occurred</th>
                        <th className="px-4 py-2">Txn ID</th>
                        <th className="px-4 py-2">MSISDN</th>
                        <th className="px-4 py-2">Amount</th>
                        <th className="px-4 py-2">Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {processedRows.slice(0, 20).map((row) => {
                        const occurredCell = row.cells.occurredAt as ProcessedCell;
                        const txnCell = row.cells.txnId as ProcessedCell;
                        const msisdnCell = row.cells.msisdn as ProcessedCell;
                        const amountCell = row.cells.amount as ProcessedCell;
                        const referenceCell = row.cells.reference as ProcessedCell | undefined;
                        const invalid = row.errors.length > 0;
                        const duplicate = parserFeedback.duplicateTxnIds.has(row.record.txnId);
                        const missingReference = !row.record.reference;
                        const className = invalid ? "bg-red-500/10" : duplicate ? "bg-amber-500/10" : undefined;
                        const occurredDisplay =
                          typeof occurredCell?.value === "string" && occurredCell.value
                            ? new Date(occurredCell.value).toLocaleString()
                            : occurredCell?.value ?? "";
                        const amountDisplay =
                          typeof amountCell?.value === "number"
                            ? amountCell.value
                            : Number(amountCell?.value ?? 0);
                        return (
                          <tr key={row.index} className={className}>
                            <td className="px-4 py-2 text-neutral-0">
                              {occurredDisplay || "—"}
                              {!occurredCell?.valid && occurredCell?.reason && (
                                <p className="mt-1 text-[10px] text-amber-200">{occurredCell.reason}</p>
                              )}
                            </td>
                            <td className="px-4 py-2 text-neutral-2">
                              {txnCell?.value ?? "—"}
                              {!txnCell?.valid && txnCell?.reason && (
                                <p className="mt-1 text-[10px] text-amber-200">{txnCell.reason}</p>
                              )}
                              {duplicate && (
                                <p className="mt-1 text-[10px] text-amber-200">Duplicate txn ID in this file</p>
                              )}
                            </td>
                            <td className="px-4 py-2 text-neutral-2">
                              {msisdnCell?.value ?? "—"}
                              {!msisdnCell?.valid && msisdnCell?.reason && (
                                <p className="mt-1 text-[10px] text-amber-200">{msisdnCell.reason}</p>
                              )}
                            </td>
                            <td className="px-4 py-2 text-neutral-2">
                              {Number.isFinite(amountDisplay) && amountDisplay > 0
                                ? amountFormatter.format(amountDisplay)
                                : amountCell?.value ?? "—"}
                              {!amountCell?.valid && amountCell?.reason && (
                                <p className="mt-1 text-[10px] text-amber-200">{amountCell.reason}</p>
                              )}
                            </td>
                            <td className="px-4 py-2 text-neutral-2">
                              {referenceCell?.value ?? "—"}
                              {missingReference && (
                                <p className="mt-1 text-[10px] text-amber-200">{t("statement.preview.noRefHint", "No reference · will require manual allocation")}</p>
                              )}
                              {!referenceCell?.valid && referenceCell?.reason && (
                                <p className="mt-1 text-[10px] text-amber-200">{referenceCell.reason}</p>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <button className="interactive-scale rounded-xl border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-neutral-2" onClick={() => setStep(2)}>
                    {t("common.back", "Back")}
                  </button>
                  <div className="flex flex-1 flex-col gap-2 text-right">
                    <div className="text-xs text-neutral-2">Valid rows: {validRows.length} / {processedRows.length}</div>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={pending || !mappingComplete || validRows.length === 0 || invalidRows.length > 0}
                      className="interactive-scale rounded-xl bg-kigali px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink shadow-glass disabled:opacity-60"
                    >
                      {pending ? t("statement.import.importing", "Importing…") : t("statement.import.confirm", "Confirm import")}
                    </button>
                    {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
                    {message && <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">{message}</p>}
                    {invalidRows.length > 0 && (
                      <div className="rounded-xl bg-amber-500/10 px-3 py-2 text-left text-[11px] text-amber-200">
                        <p>{invalidRows.length} row(s) need fixes before importing.</p>
                        <ul className="mt-1 space-y-1">
                          {invalidRows.slice(0, 3).map((row) => (
                            <li key={row.index}>Row {row.index + 1}: {row.errors[0]}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {parserFeedback.duplicateRows > 0 && (
                      <div className="rounded-xl bg-white/5 px-3 py-2 text-left text-[11px] text-neutral-2">
                        <p>{t("statement.preview.duplicatesHint", "Duplicate txn IDs detected. They will be skipped by the importer.")}</p>
                      </div>
                    )}
                    {result && (
                      <div className="space-y-2 rounded-2xl bg-white/10 px-3 py-2 text-[11px] text-neutral-0">
                        <p>Inserted: {result.inserted}</p>
                        <p>Posted: {result.posted}</p>
                        <p>Unallocated: {result.unallocated}</p>
                        <p>Duplicates skipped: {result.duplicates}</p>
                        <Link href="/recon" className="inline-block text-xs font-semibold uppercase tracking-[0.3em] text-rw-yellow hover:underline">
                          {t("statement.preview.viewRecon", "View in Recon →")}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
