"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { useToast } from "@/providers/toast-provider";

interface SaccoBrandingCardProps {
  sacco: Pick<Database["public"]["Tables"]["saccos"]["Row"],
    | "id"
    | "name"
    | "district"
    | "province"
    | "status"
    | "bnr_index"
    | "email"
    | "logo_url"
    | "brand_color"
    | "sms_sender"
    | "pdf_header_text"
    | "pdf_footer_text"
  >;
}

const supabase = getSupabaseBrowserClient();

export function SaccoBrandingCard({ sacco }: SaccoBrandingCardProps) {
  const [pending, startTransition] = useTransition();
  const defaultColor = sacco.brand_color ?? "#1273E6";
  const defaultSender = sacco.sms_sender ?? "IKIMINA";
  const [brandColor, setBrandColor] = useState(defaultColor);
  const [initialBrandColor, setInitialBrandColor] = useState(defaultColor);
  const [smsSender, setSmsSender] = useState(defaultSender);
  const [initialSmsSender, setInitialSmsSender] = useState(defaultSender);
  const [logoUrl, setLogoUrl] = useState<string | null>(sacco.logo_url ?? null);
  const [initialLogoUrl, setInitialLogoUrl] = useState<string | null>(sacco.logo_url ?? null);
  const [pdfHeader, setPdfHeader] = useState(sacco.pdf_header_text ?? "");
  const [initialPdfHeader, setInitialPdfHeader] = useState(sacco.pdf_header_text ?? "");
  const [pdfFooter, setPdfFooter] = useState(sacco.pdf_footer_text ?? "");
  const [initialPdfFooter, setInitialPdfFooter] = useState(sacco.pdf_footer_text ?? "");
  const { success, error } = useToast();
  const toBilingual = (en: string, rw: string) => `${en} / ${rw}`;
  const notifySuccess = (en: string, rw: string) => success(toBilingual(en, rw));
  const notifyError = (en: string, rw: string) => error(toBilingual(en, rw));

  const hasChanges = useMemo(
    () =>
      brandColor !== initialBrandColor ||
      smsSender !== initialSmsSender ||
      logoUrl !== initialLogoUrl ||
      pdfHeader !== initialPdfHeader ||
      pdfFooter !== initialPdfFooter,
    [brandColor, initialBrandColor, initialLogoUrl, initialPdfFooter, initialPdfHeader, initialSmsSender, logoUrl, pdfFooter, pdfHeader, smsSender]
  );

  const handleSave = () => {
    if (!hasChanges) return;
    startTransition(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from("saccos")
        .update({
          brand_color: brandColor,
          sms_sender: smsSender,
          logo_url: logoUrl,
          pdf_header_text: pdfHeader || null,
          pdf_footer_text: pdfFooter || null,
        })
        .eq("id", sacco.id);
      if (updateError) {
        notifyError(updateError.message ?? "Failed to update branding", "Kuvugurura ibirango byanze");
        return;
      }
      notifySuccess("Branding updated", "Ibirango byavuguruwe");
      setInitialBrandColor(brandColor);
      setInitialSmsSender(smsSender);
      setInitialLogoUrl(logoUrl ?? null);
      setInitialPdfHeader(pdfHeader);
      setInitialPdfFooter(pdfFooter);
    });
  };

  const handleLogoUpload = (file: File) => {
    startTransition(async () => {
      const storagePath = `saccos/${sacco.id}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("branding").upload(storagePath, file, {
        cacheControl: "3600",
        upsert: true,
      });
      if (uploadError) {
        notifyError(uploadError.message ?? "Failed to upload logo", "Gushyira logo byanze");
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("branding").getPublicUrl(storagePath);
      setLogoUrl(publicUrl);
      notifySuccess("Logo uploaded. Save changes to apply.", "Logo yashyizweho. Bika kugira ngo ikoreshwe.");
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-0">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-2">Branding</p>
          <h3 className="text-lg font-semibold">{sacco.name}</h3>
          <p className="text-xs text-neutral-2">BNR #{sacco.bnr_index} · {sacco.district}, {sacco.province}</p>
        </div>
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`${sacco.name} logo`}
              width={48}
              height={48}
              className="h-12 w-12 rounded-full border border-white/20 object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded-full border border-white/20" style={{ background: brandColor }} />
          )}
          <label className="interactive-scale cursor-pointer rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-neutral-2">
            Upload logo
            <input
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  if (file.size > 1.5 * 1024 * 1024) {
                    notifyError("Logo must be under 1.5MB", "Logo igomba kuba munsi ya 1.5MB");
                    return;
                  }
                  handleLogoUpload(file);
                }
              }}
            />
          </label>
        </div>
      </div>
      <label className="text-xs uppercase tracking-[0.3em] text-neutral-2">Primary color</label>
      <input
        type="color"
        value={brandColor}
        onChange={(event) => setBrandColor(event.target.value)}
        className="h-10 w-24 cursor-pointer rounded-xl border border-white/10 bg-white/10"
      />
      <label className="text-xs uppercase tracking-[0.3em] text-neutral-2">SMS sender ID</label>
      <input
        type="text"
        value={smsSender}
        onChange={(event) => setSmsSender(event.target.value.toUpperCase())}
        maxLength={11}
        className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
      />
      <div className="grid gap-2">
        <label className="text-xs uppercase tracking-[0.3em] text-neutral-2">
          PDF header text
        </label>
        <textarea
          value={pdfHeader}
          onChange={(event) => setPdfHeader(event.target.value)}
          rows={3}
          placeholder="e.g. Umurenge SACCO — Official Statement"
          className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
        />
        <label className="text-xs uppercase tracking-[0.3em] text-neutral-2">
          PDF footer text
        </label>
        <textarea
          value={pdfFooter}
          onChange={(event) => setPdfFooter(event.target.value)}
          rows={3}
          placeholder="e.g. Contact us at 1234 for reconciliation support"
          className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
        />
      </div>
      {logoUrl && (
        <button
          type="button"
          onClick={() => setLogoUrl(null)}
          className="self-start text-xs text-amber-200 underline-offset-2 hover:underline"
        >
          Remove logo
        </button>
      )}
      <button
        type="button"
        disabled={pending || !hasChanges}
        onClick={handleSave}
        className="interactive-scale self-end rounded-full bg-kigali px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink shadow-glass disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save branding"}
      </button>
    </div>
  );
}
