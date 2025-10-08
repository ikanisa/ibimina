"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { useToast } from "@/providers/toast-provider";
import { BilingualText } from "@/components/common/bilingual-text";
import { queueNotification } from "@/app/(main)/admin/actions";

const supabase = getSupabaseBrowserClient();

const toBilingual = (en: string, rw: string) => `${en} / ${rw}`;

const TOKEN_LIBRARY = [
  { token: "{member_name}", primary: "Member name", secondary: "Izina ry'umunyamuryango" },
  { token: "{amount}", primary: "Amount", secondary: "Amafaranga" },
  { token: "{ikimina_name}", primary: "Ikimina", secondary: "Izina ry'ikimina" },
  { token: "{sacco_name}", primary: "SACCO", secondary: "Izina rya SACCO" },
  { token: "{due_date}", primary: "Due date", secondary: "Itariki yo kwishyura" },
  { token: "{reference}", primary: "Reference", secondary: "Indango" },
];

type SaccoOption = {
  id: string;
  name: string;
};

type TemplateRow = Database["public"]["Tables"]["sms_templates"]["Row"];

type SmsTemplatePanelProps = {
  saccos: SaccoOption[];
};

export function SmsTemplatePanel({ saccos }: SmsTemplatePanelProps) {
  const [selectedSacco, setSelectedSacco] = useState<string | null>(saccos[0]?.id ?? null);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const notifySuccess = (en: string, rw: string) => toast.success(toBilingual(en, rw));
  const notifyError = (en: string, rw: string) => toast.error(toBilingual(en, rw));

  const selectedSaccoName = useMemo(
    () => saccos.find((sacco) => sacco.id === selectedSacco)?.name ?? "",
    [saccos, selectedSacco]
  );

  useEffect(() => {
    if (!selectedSacco) {
      setTemplates([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error: fetchError } = await supabase
        .from("sms_templates")
        .select("id, name, body, is_active, sacco_id, created_at, updated_at, version, tokens, description")
        .eq("sacco_id", selectedSacco)
        .order("updated_at", { ascending: false });
      if (cancelled) return;
      if (fetchError) {
        toast.error(toBilingual(fetchError.message ?? "Failed to load templates", "Kuzana inyandiko byanze"));
        return;
      }
      setTemplates(data ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedSacco, toast]);

  const resetForm = () => {
    setName("");
    setBody("");
    setDescription("");
  };

  const extractTokens = (value: string) => {
    const matches = value.match(/\{[a-zA-Z0-9_]+\}/g) ?? [];
    return Array.from(new Set(matches));
  };

  const handleCreate = () => {
    if (!selectedSacco) {
      notifyError("Select a SACCO first", "Hitamo SACCO mbere");
      return;
    }
    if (!name.trim()) {
      notifyError("Template name is required", "Izina ry'inyandiko rirakenewe");
      return;
    }
    if (!body.trim()) {
      notifyError("Template body is required", "Ubutumwa bw'inyandiko burakenewe");
      return;
    }

    startTransition(async () => {
      const tokens = extractTokens(body.trim());
      const payload: Database["public"]["Tables"]["sms_templates"]["Insert"] = {
        sacco_id: selectedSacco,
        name: name.trim(),
        body: body.trim(),
        description: description.trim() || null,
        tokens,
        version: 1,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: insertError } = await (supabase as any)
        .from("sms_templates")
        .insert(payload)
        .select("id, name, body, is_active, sacco_id, created_at, updated_at, version, tokens, description")
        .single();
      if (insertError) {
        notifyError(insertError.message ?? "Failed to create template", "Gukora inyandiko byanze");
        return;
      }
      setTemplates((prev) => [data as TemplateRow, ...prev]);
      notifySuccess("Template created", "Inyandiko yashyizweho");
      resetForm();
    });
  };

  const handleToggleActive = (template: TemplateRow) => {
    startTransition(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from("sms_templates")
        .update({ is_active: !template.is_active })
        .eq("id", template.id);
      if (updateError) {
        notifyError(updateError.message ?? "Failed to update template", "Kuvugurura inyandiko byanze");
        return;
      }
      setTemplates((prev) =>
        prev.map((item) =>
          item.id === template.id
            ? { ...item, is_active: !template.is_active, updated_at: new Date().toISOString() }
            : item
        )
      );
      notifySuccess(
        template.is_active ? "Template deactivated" : "Template activated",
        template.is_active ? "Inyandiko yahagaritswe" : "Inyandiko yashyizweho"
      );
    });
  };

  const handleDelete = (templateId: string) => {
    if (!confirm("Delete this template? / Gusiba iyi nyandiko?")) return;
    startTransition(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deleteError } = await (supabase as any).from("sms_templates").delete().eq("id", templateId);
      if (deleteError) {
        notifyError(deleteError.message ?? "Failed to delete template", "Gusiba inyandiko byanze");
        return;
      }
      setTemplates((prev) => prev.filter((item) => item.id !== templateId));
      notifySuccess("Template deleted", "Inyandiko yasibwe");
    });
  };

  const handleNewVersion = (template: TemplateRow) => {
    startTransition(async () => {
      const tokens = Array.isArray(template.tokens) ? template.tokens : extractTokens(template.body);
      const payload: Database["public"]["Tables"]["sms_templates"]["Insert"] = {
        sacco_id: template.sacco_id,
        name: template.name,
        body: template.body,
        description: template.description,
        tokens,
        version: (template.version ?? 1) + 1,
        is_active: false,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: insertError } = await (supabase as any)
        .from("sms_templates")
        .insert(payload)
        .select("id, name, body, is_active, sacco_id, created_at, updated_at, version, tokens, description")
        .single();
      if (insertError) {
        notifyError(insertError.message ?? "Failed to create new version", "Gukora verisiyo nshya byanze");
        return;
      }
      setTemplates((prev) => [data as TemplateRow, ...prev]);
      notifySuccess("New version drafted", "Verisiyo nshya yakozwe");
    });
  };

  const handleQueueTest = (template: TemplateRow) => {
    if (!template.sacco_id) {
      notifyError("Template is missing SACCO", "Inyandiko nta SACCO ifite");
      return;
    }
    startTransition(async () => {
      const result = await queueNotification({ saccoId: template.sacco_id, templateId: template.id });
      if (result.status === "error") {
        notifyError(result.message ?? "Failed to queue test", "Kohereza ikizamini byanze");
      } else {
        notifySuccess(result.message ?? "Test queued", "Ikizamini cyoherejwe");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs uppercase tracking-[0.3em] text-neutral-2">
          <BilingualText primary="SACCO" secondary="Ikigo" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
        </label>
        <select
          value={selectedSacco ?? ""}
          onChange={(event) => setSelectedSacco(event.target.value || null)}
          className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
        >
          {saccos.map((sacco) => (
            <option key={sacco.id} value={sacco.id}>
              {sacco.name}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-2">
          <BilingualText primary="Create template" secondary="Kora inyandiko" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.3em] text-neutral-2">
              <BilingualText primary="Name" secondary="Izina" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
            </span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Payment reminder / Kwibutsa umusanzu"
              className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
            />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-xs uppercase tracking-[0.3em] text-neutral-2">
              <BilingualText primary="Body" secondary="Ubutumwa" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
            </span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={4}
              placeholder="Muraho {member_name}, uributswe ku mushahara w'uku kwezi... / Hello {member_name}, this is your reminder..."
              className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
            />
            <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-neutral-2">
              {TOKEN_LIBRARY.map((token) => (
                <button
                  key={token.token}
                  type="button"
                  onClick={() => setBody((prev) => `${prev}${prev.endsWith(" ") || prev.length === 0 ? "" : " "}${token.token}`)}
                  className="rounded-full border border-white/15 px-2 py-1 text-neutral-0 hover:border-white/30"
                >
                  <BilingualText primary={token.primary} secondary={token.secondary} layout="inline" secondaryClassName="text-[9px] text-neutral-3" />
                </button>
              ))}
            </div>
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-xs uppercase tracking-[0.3em] text-neutral-2">
              <BilingualText primary="Description" secondary="Ibisobanuro" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
            </span>
            <input
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Reminder for weekly contributions"
              className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0 focus:outline-none focus:ring-2 focus:ring-rw-blue"
            />
          </label>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleCreate}
            disabled={pending || !selectedSacco}
            className="interactive-scale rounded-full bg-kigali px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink shadow-glass disabled:opacity-60"
          >
            {pending ? toBilingual("Saving…", "Birimo kubikwa…") : toBilingual("Save template", "Bika inyandiko")}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-2">
          {toBilingual(`${templates.length} template(s) for ${selectedSaccoName}`, `${templates.length} inyandiko kuri ${selectedSaccoName}`)}
        </p>
        {templates.length === 0 && (
          <p className="text-sm text-neutral-2">{toBilingual("No templates yet. Create one above to get started.", "Nta nyandiko irahari. Tangira uhange imwe hejuru.")}</p>
        )}
        <div className="space-y-3">
          {templates.map((template) => (
            <div key={template.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-0">
             <div className="flex flex-wrap items-center justify-between gap-2">
               <div>
                  <h4 className="text-base font-semibold">{template.name}</h4>
                  <p className="text-[11px] text-neutral-2">
                    {toBilingual("Version", "Verisiyo")}: {template.version ?? 1} · {toBilingual("Updated", "Byavuguruwe")}: {new Date(template.updated_at).toLocaleString()}
                  </p>
                  {template.description && (
                    <p className="text-[11px] text-neutral-2">{template.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(template)}
                    className="text-xs text-neutral-2 underline-offset-2 hover:underline"
                  >
                    {template.is_active ? toBilingual("Deactivate", "Hagarika") : toBilingual("Activate", "Koresha")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNewVersion(template)}
                    className="text-xs text-neutral-2 underline-offset-2 hover:underline"
                  >
                    {toBilingual("New version", "Verisiyo nshya")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(template.id)}
                    className="text-xs text-red-300 underline-offset-2 hover:underline"
                  >
                    {toBilingual("Delete", "Siba")}
                  </button>
                </div>
              </div>
              <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-black/30 p-3 text-sm text-neutral-0">
                {template.body}
              </pre>
              <p className="mt-2 text-[10px] text-neutral-2">
                {toBilingual("Status", "Imiterere")}: {template.is_active ? toBilingual("Active", "Ikora") : toBilingual("Inactive", "Ntikora")}
              </p>
              <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-neutral-3">
                {(Array.isArray(template.tokens) ? template.tokens : extractTokens(template.body)).map((token) => {
                  const tokenText = typeof token === "string" ? token : JSON.stringify(token);
                  return (
                    <span key={`${template.id}-${tokenText}`} className="rounded-full bg-white/10 px-2 py-1">
                      {tokenText}
                    </span>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleQueueTest(template)}
                  className="rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-neutral-0 hover:border-white/30"
                >
                  {toBilingual("Send test SMS", "Ohereza SMS ikizamini")}
                </button>
                <span className="text-[10px] text-neutral-3">
                  {toBilingual("Queues an event in notification pipeline", "Bishyira ikizamini muri pipeline ya notifikasi")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
