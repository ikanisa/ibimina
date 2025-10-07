import { useState, useMemo } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/use-user-profile";

interface MemberImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ikiminaId: string;
  onCompleted?: () => void;
}

interface ParsedRow {
  [key: string]: string;
}

interface ValidatedRow {
  fullName: string;
  msisdn: string;
  nationalId?: string | null;
  memberCode?: string | null;
  error?: string;
}

const MSISDN_REGEX = /^(07\d{8}|\+?2507\d{8})$/;
const NID_REGEX = /^\d{16}$/;

const REQUIRED_HEADERS = ["fullName", "msisdn"];
const OPTIONAL_HEADERS = ["nationalId", "memberCode"];

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

export const MemberImportWizard = ({ open, onOpenChange, ikiminaId, onCompleted }: MemberImportWizardProps) => {
  const [step, setStep] = useState<"upload" | "map" | "review">("upload");
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({
    fullName: "",
    msisdn: "",
    nationalId: "",
    memberCode: "",
  });
  const [loading, setLoading] = useState(false);
  const { data: profile } = useUserProfile();

  const mappedRows = useMemo<ValidatedRow[]>(() => {
    if (!rows.length) return [];

    return rows.map((row) => {
      const fullName = row[mapping.fullName]?.trim();
      const msisdnRaw = row[mapping.msisdn]?.trim();
      const nationalIdRaw = mapping.nationalId ? row[mapping.nationalId]?.trim() : undefined;
      const memberCodeRaw = mapping.memberCode ? row[mapping.memberCode]?.trim() : undefined;

      if (!fullName || !msisdnRaw) {
        return {
          fullName: fullName ?? "",
          msisdn: msisdnRaw ?? "",
          error: "Missing required fields",
        };
      }

      const normalizedMsisdn = normalizeMsisdn(msisdnRaw);

      if (!MSISDN_REGEX.test(normalizedMsisdn)) {
        return {
          fullName,
          msisdn: normalizedMsisdn,
          error: "Invalid MSISDN",
        };
      }

      if (nationalIdRaw && !NID_REGEX.test(nationalIdRaw)) {
        return {
          fullName,
          msisdn: normalizedMsisdn,
          nationalId: nationalIdRaw,
          error: "Invalid National ID",
        };
      }

      return {
        fullName,
        msisdn: normalizedMsisdn,
        nationalId: nationalIdRaw || null,
        memberCode: memberCodeRaw || null,
      };
    });
  }, [rows, mapping]);

  const errorCount = mappedRows.filter((row) => row.error).length;

  const resetWizard = () => {
    setStep("upload");
    setFileName(null);
    setHeaders([]);
    setRows([]);
    setMapping({
      fullName: "",
      msisdn: "",
      nationalId: "",
      memberCode: "",
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

        setFileName(file.name);
        setHeaders(result.meta.fields);
        setRows(result.data as ParsedRow[]);

        const normalizedHeaders = result.meta.fields.map((header) => header.trim().toLowerCase());

        setMapping({
          fullName: result.meta.fields[normalizedHeaders.indexOf("fullname")] ?? "",
          msisdn: result.meta.fields[normalizedHeaders.indexOf("msisdn")] ?? "",
          nationalId: result.meta.fields[normalizedHeaders.indexOf("nationalid")] ?? "",
          memberCode: result.meta.fields[normalizedHeaders.indexOf("membercode")] ?? "",
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

  const canProceedToReview = REQUIRED_HEADERS.every((header) => mapping[header]);

  const handleImport = async () => {
    if (!mappedRows.length) return;

    if (errorCount > 0) {
      toast.error("Fix validation errors before importing");
      return;
    }

    setLoading(true);

    try {
      const payload = mappedRows.map((row) => ({
        fullName: row.fullName,
        msisdn: row.msisdn,
        nationalId: row.nationalId,
        memberCode: row.memberCode,
      }));

      const { data, error } = await supabase.functions.invoke("secure-import-members", {
        body: {
          ikiminaId,
          members: payload,
          actorId: profile?.id,
        },
      });

      if (error) {
        console.error(error);
        toast.error(error.message ?? "Failed to import members");
        return;
      }

      toast.success(`${data?.inserted ?? payload.length} members imported securely`);
      onCompleted?.();
      onOpenChange(false);
      resetWizard();
    } catch (error) {
      console.error(error);
      toast.error("Failed to import members");
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
          <DialogTitle>Bulk import members</DialogTitle>
          <DialogDescription>
            Upload the CSV/Excel export provided to group facilitators. Required columns: fullName, msisdn.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={step} onValueChange={(value) => setStep(value as typeof step)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="map" disabled={step === "upload"}>Map columns</TabsTrigger>
            <TabsTrigger value="review" disabled={step !== "review"}>Review & import</TabsTrigger>
          </TabsList>

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
                Downloadable template headers: fullName, msisdn, nationalId (optional), memberCode (optional).
              </p>
            </div>
          </TabsContent>

          <TabsContent value="map" className="space-y-4 pt-4">
            <Alert>
              <AlertTitle>Column mapping</AlertTitle>
              <AlertDescription>
                Match the required fields to the headers detected in your file. Only mapped fields will be imported.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 sm:grid-cols-2">
              {REQUIRED_HEADERS.map((header) => (
                <div key={header} className="space-y-2">
                  <p className="text-sm font-medium capitalize">
                    {header === "fullName" ? "Full name" : header === "msisdn" ? "MSISDN" : header}
                    <Badge variant="secondary" className="ml-2">Required</Badge>
                  </p>
                  <Select value={mapping[header]} onValueChange={(value) => setMapping((prev) => ({ ...prev, [header]: value }))}>
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
              {OPTIONAL_HEADERS.map((header) => (
                <div key={header} className="space-y-2">
                  <p className="text-sm font-medium capitalize">
                    {header === "nationalId" ? "National ID" : header === "memberCode" ? "Member code" : header}
                  </p>
                  <Select
                    value={mapping[header]}
                    onValueChange={(value) => setMapping((prev) => ({ ...prev, [header]: value }))}
                  >
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
                    <TableHead>Name</TableHead>
                    <TableHead>MSISDN</TableHead>
                    <TableHead>National ID</TableHead>
                    <TableHead>Member code</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappedRows.slice(0, 25).map((row, index) => (
                    <TableRow key={`${row.msisdn}-${index}`} className={row.error ? "bg-destructive/10" : undefined}>
                      <TableCell>{row.fullName}</TableCell>
                      <TableCell>{row.msisdn}</TableCell>
                      <TableCell>{row.nationalId ?? "-"}</TableCell>
                      <TableCell>{row.memberCode ?? "-"}</TableCell>
                      <TableCell>
                        {row.error ? <Badge variant="destructive">{row.error}</Badge> : <Badge variant="outline">Ready</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {mappedRows.length > 25 && (
              <p className="text-xs text-muted-foreground text-right">Showing first 25 rows of {mappedRows.length}</p>
            )}

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                File: {fileName} · {mappedRows.length} rows
              </div>
              <Button disabled={loading || errorCount > 0} onClick={handleImport}>
                {loading ? "Importing..." : "Import members"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
