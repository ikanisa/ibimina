import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExportRequest {
  saccoId?: string;
  district?: string;
  start?: string;
  end?: string;
  format?: "csv" | "pdf";
}

const parseDate = (value: string | undefined, fallback: Date) => {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }
  return parsed;
};

const formatCurrency = (amount: number) => new Intl.NumberFormat("rw-RW", { style: "currency", currency: "RWF", minimumFractionDigits: 0 }).format(amount);

const toDateOnly = (value: Date) => value.toISOString().slice(0, 10);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const queryParams: ExportRequest = {
      saccoId: url.searchParams.get("saccoId") ?? undefined,
      district: url.searchParams.get("district") ?? undefined,
      start: url.searchParams.get("start") ?? undefined,
      end: url.searchParams.get("end") ?? undefined,
      format: (url.searchParams.get("format") as "csv" | "pdf" | null) ?? "pdf",
    };

    let params: ExportRequest = { ...queryParams };

    if (req.method !== "GET") {
      const contentType = req.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
        if (body && typeof body === "object") {
          const readString = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : undefined);
          const readFormat = (value: unknown): "csv" | "pdf" | undefined =>
            value === "csv" || value === "pdf" ? value : undefined;

          params = {
            saccoId: readString(body.saccoId) ?? params.saccoId ?? readString(body.sacco_id),
            district: readString(body.district) ?? params.district,
            start: readString(body.start) ?? readString(body.from) ?? params.start,
            end: readString(body.end) ?? readString(body.to) ?? params.end,
            format: readFormat(body.format) ?? params.format ?? "pdf",
          };
        }
      }
    }

    params.format = params.format ?? "pdf";

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const start = parseDate(params.start, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const end = parseDate(params.end, new Date());

    let saccoIds: string[] | undefined;

    if (params.saccoId) {
      saccoIds = [params.saccoId];
    } else if (params.district) {
      const { data: saccoRows } = await supabase.from("saccos").select("id").eq("district", params.district);
      saccoIds = (saccoRows ?? []).map((row) => row.id as string);
    }

    let paymentsQuery = supabase
      .from("payments")
      .select("id, sacco_id, ikimina_id, amount, occurred_at, status")
      .gte("occurred_at", start.toISOString())
      .lte("occurred_at", end.toISOString());

    if (saccoIds?.length) {
      paymentsQuery = paymentsQuery.in("sacco_id", saccoIds);
    }

    const { data: payments, error: paymentsError } = await paymentsQuery;

    if (paymentsError) {
      throw paymentsError;
    }

    const { data: ibiminaRows } = await supabase.from("ibimina").select("id, name, code, sacco_id");

    const totalsByIkimina = new Map<string, { name: string; code: string; amount: number }>();
    let grandTotal = 0;

    for (const payment of payments ?? []) {
      if (!payment.ikimina_id || !["POSTED", "SETTLED"].includes(payment.status)) continue;
      const match = (ibiminaRows ?? []).find((row) => row.id === payment.ikimina_id);
      if (!match) continue;
      const current = totalsByIkimina.get(payment.ikimina_id) ?? { name: match.name, code: match.code, amount: 0 };
      current.amount += payment.amount;
      totalsByIkimina.set(payment.ikimina_id, current);
      grandTotal += payment.amount;
    }

    const sortedTotals = Array.from(totalsByIkimina.values()).sort((a, b) => b.amount - a.amount);

    if (params.format === "csv") {
      let csv = "Ikimina,Code,Amount\n";
      for (const row of sortedTotals) {
        csv += `${row.name},${row.code},${row.amount}\n`;
      }
      csv += `Total,,${grandTotal}\n`;

      return new Response(csv, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="ibimina-report-${toDateOnly(start)}-to-${toDateOnly(end)}.csv"`,
        },
      });
    }

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const { height } = page.getSize();

    // Branding
    let titleColor = rgb(0, 0.63, 0.87);
    let saccoName: string | null = null;
    let logoBytes: Uint8Array | null = null;
    if (params.saccoId) {
      const { data: saccoRow } = await supabase
        .from("saccos")
        .select("name, logo_url, brand_color")
        .eq("id", params.saccoId)
        .single();
      if (saccoRow) {
        saccoName = (saccoRow as { name: string | null }).name ?? null;
        const brand = (saccoRow as { brand_color?: string | null }).brand_color ?? null;
        if (brand && /^#?[0-9a-fA-F]{6}$/.test(brand)) {
          const hex = brand.startsWith('#') ? brand.slice(1) : brand;
          const r = parseInt(hex.slice(0,2),16)/255;
          const g = parseInt(hex.slice(2,4),16)/255;
          const b = parseInt(hex.slice(4,6),16)/255;
          titleColor = rgb(r,g,b);
        }
        const logoUrl = (saccoRow as { logo_url?: string | null }).logo_url ?? null;
        if (logoUrl) {
          try {
            const res = await fetch(logoUrl);
            if (res.ok) {
              const arr = new Uint8Array(await res.arrayBuffer());
              logoBytes = arr;
            }
          } catch (_) {
            // ignore logo fetch failures
          }
        }
      }
    }

    const headerTitle = saccoName ? `${saccoName} — Ibimina` : "Umurenge SACCO — Ibimina";
    let cursorY = height - 72;
    if (logoBytes) {
      try {
        const isPng = logoBytes[0] === 0x89 && logoBytes[1] === 0x50; // crude check
        const img = isPng ? await pdf.embedPng(logoBytes) : await pdf.embedJpg(logoBytes);
        const scaled = img.scale(60 / img.height);
        page.drawImage(img, { x: 48, y: height - 72 - scaled.height + 8, width: scaled.width, height: scaled.height });
        page.drawText(headerTitle, { x: 48 + scaled.width + 12, y: height - 72, size: 20, font: bold, color: titleColor });
      } catch {
        page.drawText(headerTitle, { x: 48, y: height - 72, size: 20, font: bold, color: titleColor });
      }
    } else {
      page.drawText(headerTitle, { x: 48, y: height - 72, size: 20, font: bold, color: titleColor });
    }
    page.drawText("Reporting summary", { x: 48, y: height - 96, size: 12, font });
    page.drawText(`Period: ${toDateOnly(start)} → ${toDateOnly(end)}`, { x: 48, y: height - 114, size: 10, font });
    page.drawText(`Total posted: ${formatCurrency(grandTotal)}`, { x: 48, y: height - 132, size: 10, font });

    cursorY = height - 168;
    const rowHeight = 18;

    page.drawText("Ikimina", { x: 48, y: cursorY, size: 11, font: bold });
    page.drawText("Code", { x: 240, y: cursorY, size: 11, font: bold });
    page.drawText("Amount", { x: 360, y: cursorY, size: 11, font: bold });
    cursorY -= rowHeight;

    for (const row of sortedTotals) {
      if (cursorY < 72) {
        page.drawText("…", { x: 48, y: cursorY, size: 11, font });
        break;
      }
      page.drawText(row.name, { x: 48, y: cursorY, size: 10, font });
      page.drawText(row.code, { x: 240, y: cursorY, size: 10, font });
      page.drawText(formatCurrency(row.amount), { x: 360, y: cursorY, size: 10, font });
      cursorY -= rowHeight;
    }

    page.drawRectangle({ x: 48, y: cursorY - 1, width: 472, height: 0.75, color: rgb(0.12, 0.25, 0.2) });
    cursorY -= rowHeight;
    page.drawText(`Grand total: ${formatCurrency(grandTotal)}`, { x: 48, y: cursorY, size: 11, font: bold });

    // Footer
    page.drawText(`Generated by SACCO+ on ${new Date().toISOString().slice(0,10)}`,
      { x: 48, y: 48, size: 9, font, color: rgb(0.35,0.45,0.5) });

    const pdfBytes = await pdf.save();

    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ibimina-report-${toDateOnly(start)}-to-${toDateOnly(end)}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Export report failed", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
