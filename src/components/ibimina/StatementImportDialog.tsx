import { useMemo, useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/use-user-profile";

interface StatementImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saccoId: string;
  ikiminaId?: string;
  onCompleted?: () => void;
}

interface ParsedRow {
  [key: string]: string;
}

interface NormalizedRow {
  occurredAt: string;
  txnId: string;
  msisdn: string;
  amount: number;
  reference?: string | null;
  status?: string | null;
  error?: string;
}

const REQUIRED_FIELDS = ["occurredAt", "txnId", "msisdn", "amount"];
const OPTIONAL_FIELDS = ["reference", "status"];

const normalizeDate = (value: string) => {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }
  return "";
};

const normalizeMsisdn = (value: string) => {
  const digits = value.replace(/[^0-9]/g, "");
  if (digits.startsWith("07")) {
    return `+250${digits.slice(2)}`;
  }
  if (digits.startsWith("2507")) {
    return `+${digits}`;
  }
  if (digits.startsWith("+2507")) {
    return digits;
  }
  return value;
};

export const StatementImportDialog = ({ open, onOpenChange, saccoId, ikiminaId, onCompleted }: StatementImportDialogProps) => {
  const [step, setStep] = useState<"upload" | "map" | "review">("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({
    occurredAt: "",
    txnId: "",
    msisdn: "",
    amount: "",
    reference: "",
    status: "",
  });
  const [loading, setLoading] = useState(false);
  const { data: profile } = useUserProfile();

  const normalizedRows = useMemo<NormalizedRow[]>(() => {
    if (!rows.length) return [];

    return rows.map((row) => {
      const occurredAtRaw = mapping.occurredAt ? row[mapping.occurredAt] : undefined;
      const txnId = mapping.txnId ? row[mapping.txnId]?.trim() : undefined;
      const msisdnRaw = mapping.msisdn ? row[mapping.msisdn]?.trim() : undefined;
      const amountRaw = mapping.amount ? row[mapping.amount]?.trim() : undefined;
      const reference = mapping.reference ? row[mapping.reference]?.trim() : undefined;
      const status = mapping.status ? row[mapping.status]?.trim() : undefined;

      if (!occurredAtRaw || !txnId || !msisdnRaw || !amountRaw) {
        return {
          occurredAt: "",
          txnId: txnId ?? "",
          msisdn: msisdnRaw ?? "",
          amount: Number(amountRaw ?? 0),
          reference: reference ?? null,
          status: status ?? null,
          error: "Missing required fields",
        };
      }

      const occurredAt = normalizeDate(occurredAtRaw);
      const msisdn = normalizeMsisdn(msisdnRaw);
      const amount = Number(amountRaw.toString().replace(/,/g, ""));

      if (!occurredAt) {
        return {
          occurredAt: "",
          txnId,
          msisdn,
          amount,
          reference: reference ?? null,
          status: status ?? null,
          error: "Invalid date",
        };
      }

      if (!txnId) {
        return {
          occurredAt,
          txnId: "",
          msisdn,
          amount,
          reference: reference ?? null,
          status: status ?? null,
          error: "Missing transaction ID",
        };
      }

      if (!msisdn.startsWith("+2507")) {
        return {
          occurredAt,
          txnId,
          msisdn,
          amount,
          reference: reference ?? null,
          status: status ?? null,
          error: "Invalid MSISDN",
        };
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        return {
          occurredAt,
          txnId,
          msisdn,
          amount,
          reference: reference ?? null,
          status: status ?? null,
          error: "Invalid amount",
        };
      }

      return {
        occurredAt,
        txnId,
        msisdn,
        amount,
        reference: reference || null,
        status: status || null,
      };
    });
  }, [rows, mapping]);

  const errorCount = normalizedRows.filter((row) => row.error).length;

  const resetWizard = () => {
    setStep("upload");
    setHeaders([]);
    setRows([]);
    setFileName(null);
    setMapping({
      occurredAt: "",
      txnId: "",
      msisdn: "",
      amount: "",
      reference: "",
      status: "",
    });
  };

  const handleFile = (file: File) => {
    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setLoading(false);

        if (!result.meta.fields?.length) {
          toast.error("Could not read CSV headers");
          return;
        }

        setHeaders(result.meta.fields);
        setRows(result.data as ParsedRow[]);
        setFileName(file.name);

        const normalizedHeaders = result.meta.fields.map((header) => header.trim().toLowerCase());

        setMapping({
          occurredAt: result.meta.fields[normalizedHeaders.indexOf("occurredat")] ?? "",
          txnId: result.meta.fields[normalizedHeaders.indexOf("txnid")] ??
            result.meta.fields[normalizedHeaders.indexOf("transactionid")] ?? "",
          msisdn: result.meta.fields[normalizedHeaders.indexOf("msisdn")] ?? "",
          amount: result.meta.fields[normalizedHeaders.indexOf("amount")] ?? "",
          reference: result.meta.fields[normalizedHeaders.indexOf("reference")] ?? "",
          status: result.meta.fields[normalizedHeaders.indexOf("status")] ?? "",
        });

        setStep("map");
      },
      error: (error) => {
        setLoading(false);
        console.error(error);
        toast.error("Failed to parse CSV");
      },
    });
  };

  const canProceedToReview = REQUIRED_FIELDS.every((field) => mapping[field]);

  const handleImport = async () => {
    if (!normalizedRows.length) return;

    if (errorCount > 0) {
      toast.error("Fix validation errors before importing");
      return;
    }

    setLoading(true);

    try {
      const payload = normalizedRows.map((row) => ({
        occurredAt: row.occurredAt,
        txnId: row.txnId,
        msisdn: row.msisdn,
        amount: row.amount,
        reference: row.reference,
        status: row.status,
      }));

      const { data, error } = await supabase.functions.invoke("import-statement", {
        body: {
          saccoId,
          ikiminaId,
          rows: payload,
          actorId: profile?.id,
        },
      });

      if (error) {
        console.error(error);
        toast.error(error.message || "Failed to import statement");
        return;
      }

      toast.success(`Processed ${data.inserted} new payments · ${data.duplicates} duplicates skipped`);
      onCompleted?.();
      onOpenChange(false);
      resetWizard();
    } catch (error) {
      console.error(error);
      toast.error("Failed to import statement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          resetWizard();
        }
        onOpenChange(value);
      }}
    >
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Import MoMo statement</DialogTitle>
          <DialogDescription>
            Map the columns exported from MTN portal to reconcile deposits. Duplicate transactions are ignored automatically.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={step} onValueChange={(value) => setStep(value as typeof step)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="map" disabled={step === "upload"}>Map columns</TabsTrigger>
            <TabsTrigger value="review" disabled={step !== "review"}>Review & import</TabsTrigger>
          </TabsList>

        ...
          <TabsContent value="upload" className="space-y-4 pt-4">
            <div className="border border-dashed rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv, text/csv, application/vnd.ms-excel"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    handleFile(file);
                  }
                }}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Supported headers: occurredAt, txnId, msisdn, amount, reference (optional), status (optional).
              </p>
            </div>
          </TabsContent>

          <TabsContent value="map" className="space-y-4 pt-4">
            <Alert>
              <AlertTitle>Column mapping</AlertTitle>
              <AlertDescription>
                Match the columns exported by MTN to the fields we need. Amounts are validated as positive integers.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 sm:grid-cols-2">
              {REQUIRED_FIELDS.map((field) => (
                <div key={field} className="space-y-2">
                  <p className="text-sm font-medium capitalize">
                    {field === "occurredAt" ? "Occurred at" : field === "txnId" ? "Transaction ID" : field === "msisdn" ? "MSISDN" : "Amount"}
                    <Badge variant="secondary" className="ml-2">Required</Badge>
                  </p>
                  <Select value={mapping[field]} onValueChange={(value) => setMapping((prev) => ({ ...prev, [field]: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((headerOption) => (
                        <SelectItem key={headerOption} value={headerOption}>
                          {headerOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {OPTIONAL_FIELDS.map((field) => (
                <div key={field} className="space-y-2">
                  <p className="text-sm font-medium capitalize">{field}</p>
                  <Select value={mapping[field]} onValueChange={(value) => setMapping((prev) => ({ ...prev, [field]: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Ignore</SelectItem>
                      {headers.map((headerOption) => (
                        <SelectItem key={headerOption} value={headerOption}>
                          {headerOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button disabled={!canProceedToReview} onClick={() => setStep("review")}>Continue</Button>
            </div>
          </TabsContent>

          <TabsContent value="review" className="space-y-4 pt-4">
            {errorCount > 0 ? (
              <Alert variant="destructive">
                <AlertTitle>{errorCount} row(s) need attention</AlertTitle>
                <AlertDescription>Fix validation issues before importing.</AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertTitle>Validation passed</AlertTitle>
                <AlertDescription>All rows look good. Review and confirm import.</AlertDescription>
              </Alert>
            )}

            <div className="max-h-64 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Occurred at</TableHead>
                    <TableHead>Txn ID</TableHead>
                    <TableHead>MSISDN</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Validation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {normalizedRows.slice(0, 25).map((row, index) => (
                    <TableRow key={`${row.txnId}-${index}`} className={row.error ? "bg-destructive/10" : undefined}>
                      <TableCell>{row.occurredAt ? new Date(row.occurredAt).toLocaleString() : "-"}</TableCell>
                      <TableCell>{row.txnId}</TableCell>
                      <TableCell>{row.msisdn}</TableCell>
                      <TableCell>{new Intl.NumberFormat("rw-RW", { style: "currency", currency: "RWF", minimumFractionDigits: 0 }).format(row.amount)}</TableCell>
                      <TableCell>{row.reference ?? "-"}</TableCell>
                      <TableCell>{row.status ?? "-"}</TableCell>
                      <TableCell>
                        {row.error ? <Badge variant="destructive">{row.error}</Badge> : <Badge variant="outline">Ready</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {normalizedRows.length > 25 && (
              <p className="text-xs text-muted-foreground text-right">Showing first 25 rows of {normalizedRows.length}</p>
            )}

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                File: {fileName} · {normalizedRows.length} rows
              </div>
              <Button disabled={loading || errorCount > 0} onClick={handleImport}>
                {loading ? "Importing..." : "Import statement"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
