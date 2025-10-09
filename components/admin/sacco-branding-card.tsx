"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { useToast } from "@/providers/toast-provider";

interface SaccoBrandingCardProps {
  sacco: Pick<
    Database["public"]["Tables"]["saccos"]["Row"],
    "id" | "name" | "district" | "province" | "status" | "email" | "logo_url" | "category"
  >;
}

const supabase = getSupabaseBrowserClient();

export function SaccoBrandingCard({ sacco }: SaccoBrandingCardProps) {
  const [pending, startTransition] = useTransition();
  const [logoUrl, setLogoUrl] = useState<string | null>(sacco.logo_url ?? null);
  const { success, error } = useToast();

  const toBilingual = (en: string, rw: string) => `${en} / ${rw}`;
  const notifySuccess = (en: string, rw: string) => success(toBilingual(en, rw));
  const notifyError = (en: string, rw: string) => error(toBilingual(en, rw));

  const updateLogo = async (logoUrl: string | null) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from("saccos")
      .update({ logo_url: logoUrl })
      .eq("id", sacco.id);
    if (updateError) {
      notifyError(updateError.message ?? "Failed to update logo", "Kuvugurura logo byanze");
      throw updateError;
    }
    notifySuccess("Logo updated", "Logo yavuguruwe");
    setLogoUrl(logoUrl);
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
      await updateLogo(publicUrl);
    });
  };

  const handleRemoveLogo = () => {
    startTransition(async () => {
      await updateLogo(null);
    });
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-0">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-2">SACCO Profile</p>
          <h3 className="text-lg font-semibold">{sacco.name}</h3>
          <p className="text-xs text-neutral-2">
            {sacco.district}, {sacco.province}
          </p>
          <p className="text-xs text-neutral-3">{sacco.category}</p>
          {sacco.email && <p className="text-xs text-neutral-2">{sacco.email}</p>}
        </div>
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`${sacco.name} logo`}
              width={64}
              height={64}
              className="h-16 w-16 rounded-full border border-white/20 object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-white/20 text-xs text-neutral-2">
              No logo
            </div>
          )}
          <label className="interactive-scale cursor-pointer rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-neutral-2">
            Upload logo
            <input
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (file.size > 1.5 * 1024 * 1024) {
                  notifyError("Logo must be under 1.5MB", "Logo igomba kuba munsi ya 1.5MB");
                  return;
                }
                handleLogoUpload(file);
              }}
            />
          </label>
        </div>
      </div>
      {logoUrl && (
        <button
          type="button"
          onClick={handleRemoveLogo}
          disabled={pending}
          className="self-start text-xs text-amber-200 underline-offset-2 hover:underline disabled:opacity-60"
        >
          Remove logo
        </button>
      )}
    </div>
  );
}
