"use client";

import { useMemo, useState, useTransition } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";
import { BilingualText } from "@/components/common/bilingual-text";

const supabase = getSupabaseBrowserClient();

type SaccoRow = Pick<
  Database["public"]["Tables"]["saccos"]["Row"],
  "id" | "name" | "district" | "province" | "sector" | "status" | "email" | "category" | "logo_url" | "sector_code"
>;

type SaccoRegistryManagerProps = {
  initialSaccos: SaccoRow[];
};

type SaccoFormState = SaccoRow;

const PROVINCES = [
  "CITY OF KIGALI",
  "NORTHERN PROVINCE",
  "SOUTHERN PROVINCE",
  "EASTERN PROVINCE",
  "WESTERN PROVINCE",
];

const STATUS_OPTIONS: SaccoRow["status"][] = ["ACTIVE", "SUSPENDED", "INACTIVE"];

function buildSectorCode(district: string, sector: string) {
  const raw = `${district}-${sector}`.toUpperCase().replace(/[^A-Z0-9]+/g, "-");
  return raw.replace(/^-+|-+$/g, "");
}

function buildSearchSlug(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const DEFAULT_CATEGORY = "Deposit-Taking Microfinance Cooperative (UMURENGE SACCO)";

export function SaccoRegistryManager({ initialSaccos }: SaccoRegistryManagerProps) {
  const [saccos, setSaccos] = useState<SaccoRow[]>(initialSaccos);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<SaccoFormState | null>(null);
  const [mode, setMode] = useState<"edit" | "create">("edit");
  const [pending, startTransition] = useTransition();
  const { success, error } = useToast();

  const toBilingual = (en: string, rw: string) => `${en} / ${rw}`;
  const notifySuccess = (en: string, rw: string) => success(toBilingual(en, rw));
  const notifyError = (en: string, rw: string) => error(toBilingual(en, rw));

  const filtered = useMemo(() => {
    if (!search.trim()) return saccos;
    const lowered = search.toLowerCase();
    return saccos.filter((sacco) =>
      `${sacco.name} ${sacco.district} ${sacco.province} ${sacco.category}`.toLowerCase().includes(lowered)
    );
  }, [saccos, search]);

  const resetForm = () => {
    setEditing(null);
    setMode("edit");
  };

  const handleEdit = (sacco: SaccoRow) => {
    setEditing({
      ...sacco,
      category: sacco.category || DEFAULT_CATEGORY,
      email: sacco.email ?? "",
      logo_url: sacco.logo_url ?? null,
      sector_code: buildSectorCode(sacco.district, sacco.sector),
    });
    setMode("edit");
  };

  const handleCreate = () => {
    setEditing({
      id: "",
      name: "",
      district: "",
      province: PROVINCES[0],
      sector: "",
      status: "ACTIVE",
      email: "",
      category: DEFAULT_CATEGORY,
      logo_url: null,
      sector_code: "",
    });
    setMode("create");
  };

  const handleChange = <K extends keyof SaccoFormState>(key: K, value: SaccoFormState[K]) => {
    setEditing((current) => (current ? { ...current, [key]: value } : current));
  };

  const validateForm = (state: SaccoFormState | null) => {
    if (!state) return toBilingual("No record selected", "Nta makuru mwatoranyije");
    if (!state.name.trim()) return toBilingual("Name is required", "Izina rirakenewe");
    if (!state.district.trim()) return toBilingual("District is required", "Akarere karakenewe");
    if (!state.sector.trim()) return toBilingual("Sector is required", "Umurenge urakenewe");
    if (!state.province.trim()) return toBilingual("Province is required", "Intara irakenewe");
    return null;
  };

  const handleSubmit = () => {
    const message = validateForm(editing);
    if (message) {
      error(message);
      return;
    }
    if (!editing) return;
    const sectorCode = buildSectorCode(editing.district, editing.sector);

    startTransition(async () => {
      try {
        const basePayload = {
          name: editing.name.trim(),
          district: editing.district.trim().toUpperCase(),
          province: editing.province.trim().toUpperCase(),
          sector: editing.sector.trim().toUpperCase(),
          sector_code: sectorCode,
          category: (editing.category || DEFAULT_CATEGORY).trim(),
          status: editing.status,
          email: editing.email?.trim() ? editing.email.trim() : null,
          logo_url: editing.logo_url ?? null,
          search_slug: buildSearchSlug(editing.name),
        };

        if (mode === "create") {
          const payload: Database["public"]["Tables"]["saccos"]["Insert"] = basePayload;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data, error: insertError } = await (supabase as any)
            .from("saccos")
            .insert(payload)
            .select("id, name, district, province, sector, status, email, category, logo_url, sector_code")
            .single();
          if (insertError) throw insertError;
          setSaccos((prev) => [...prev, data as SaccoRow]);
          notifySuccess("SACCO created", "SACCO yashyizweho");
          resetForm();
        } else {
          const payload: Database["public"]["Tables"]["saccos"]["Update"] = basePayload;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data, error: updateError } = await (supabase as any)
            .from("saccos")
            .update(payload)
            .eq("id", editing.id)
            .select("id, name, district, province, sector, status, email, category, logo_url, sector_code")
            .single();
          if (updateError) throw updateError;
          if (data) {
            setSaccos((prev) => prev.map((item) => (item.id === editing.id ? (data as SaccoRow) : item)));
          }
          notifySuccess("SACCO updated", "SACCO yavuguruwe");
          resetForm();
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Operation failed";
        notifyError(message, "Igikorwa cyanze");
      }
    });
  };

  const handleDelete = (saccoId: string) => {
    if (!confirm("Delete this SACCO? This cannot be undone. / Gusiba iyi SACCO? Ntabwo bizasubizwa.")) return;
    startTransition(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deleteError } = await (supabase as any).from("saccos").delete().eq("id", saccoId);
      if (deleteError) {
        notifyError(deleteError.message ?? "Failed to delete SACCO", "Gusiba SACCO byanze");
        return;
      }
      setSaccos((prev) => prev.filter((s) => s.id !== saccoId));
      notifySuccess("SACCO deleted", "SACCO yasibwe");
      if (editing?.id === saccoId) {
        resetForm();
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
       <input
         type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search name, district / Shakisha izina, akarere"
         className="w-full max-w-xs rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
       />
       <button
         type="button"
         onClick={handleCreate}
         className="interactive-scale rounded-full bg-kigali px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink shadow-glass"
       >
          <BilingualText
            primary="New SACCO"
            secondary="SACCO nshya"
            layout="inline"
            className="items-center gap-1"
            secondaryClassName="text-[10px] text-ink/80"
          />
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto rounded-2xl border border-white/10">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.2em] text-neutral-2">
            <tr>
              <th className="px-4 py-3">
                <BilingualText primary="Name" secondary="Izina" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
              </th>
              <th className="px-4 py-3">
                <BilingualText primary="District" secondary="Akarere" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
              </th>
              <th className="px-4 py-3">
                <BilingualText primary="Province" secondary="Intara" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
              </th>
              <th className="px-4 py-3">
                <BilingualText primary="Status" secondary="Imiterere" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
              </th>
              <th className="px-4 py-3 text-right">
                <BilingualText primary="Actions" secondary="Ibikorwa" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((sacco) => (
              <tr key={sacco.id} className="hover:bg-white/5">
                <td className="px-4 py-3 font-medium text-neutral-0">{sacco.name}</td>
                <td className="px-4 py-3 text-neutral-2">{sacco.district}</td>
                <td className="px-4 py-3 text-neutral-2">{sacco.province}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.2em]",
                    sacco.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-200"
                  )}>
                    {sacco.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                   <button
                     type="button"
                     onClick={() => handleEdit(sacco)}
                     className="text-xs text-neutral-2 underline-offset-2 hover:underline"
                   >
                      <BilingualText primary="Edit" secondary="Hindura" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(sacco.id)}
                      className="text-xs text-red-300 underline-offset-2 hover:underline"
                    >
                      <BilingualText primary="Delete" secondary="Siba" layout="inline" secondaryClassName="text-[10px] text-red-200" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-2">
                  {toBilingual("No SACCOs match this search.", "Nta SACCO ihuye n'iri shakisha.")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-2">
                {mode === "create" ? "Create SACCO" : "Edit SACCO"}
              </p>
              <h3 className="text-lg font-semibold">{editing.name || "New SACCO"}</h3>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-neutral-2 underline-offset-2 hover:underline"
            >
              <BilingualText primary="Close" secondary="Funga" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.3em] text-neutral-2">Name</span>
              <input
                type="text"
                value={editing.name}
                onChange={(event) => handleChange("name", event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.3em] text-neutral-2">Province</span>
              <select
                value={editing.province}
                onChange={(event) => handleChange("province", event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
              >
                {PROVINCES.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.3em] text-neutral-2">District</span>
              <input
                type="text"
                value={editing.district}
                onChange={(event) => handleChange("district", event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.3em] text-neutral-2">Sector</span>
              <input
                type="text"
                value={editing.sector}
                onChange={(event) => handleChange("sector", event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.3em] text-neutral-2">Status</span>
              <select
                value={editing.status}
                onChange={(event) => handleChange("status", event.target.value as SaccoRow["status"])}
                className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.3em] text-neutral-2">Email</span>
              <input
                type="email"
                value={editing.email ?? ""}
                onChange={(event) => handleChange("email", event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
              />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs uppercase tracking-[0.3em] text-neutral-2">Category</span>
              <input
                type="text"
                value={editing.category}
                onChange={(event) => handleChange("category", event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
              />
            </label>
          </div>

          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-neutral-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={pending}
              className="interactive-scale rounded-full bg-kigali px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink shadow-glass disabled:opacity-60"
            >
              {pending ? "Saving…" : mode === "create" ? "Create" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
