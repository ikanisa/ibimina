import { GradientHeader } from "@/components/ui/gradient-header";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusChip } from "@/components/common/status-chip";
import { InviteUserForm } from "@/components/admin/invite-user-form";
import { SaccoRegistryManager } from "@/components/admin/sacco-registry-manager";
import { SaccoBrandingCard } from "@/components/admin/sacco-branding-card";
import { SmsTemplatePanel } from "@/components/admin/sms-template-panel";
import { UserAccessTable } from "@/components/admin/user-access-table";
import { NotificationQueueTable } from "@/components/admin/notification-queue-table";
import { requireUserAndProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BilingualText } from "@/components/common/bilingual-text";
import type { Database } from "@/lib/supabase/types";

export default async function AdminPage() {
  const { profile } = await requireUserAndProfile();

  if (profile.role !== "SYSTEM_ADMIN") {
    return (
      <GlassCard
        title={<BilingualText primary="Restricted" secondary="Ntibyemewe" />}
        subtitle={
          <BilingualText
            primary="Administrator permissions are required to manage global settings."
            secondary="Ukeneye uburenganzira bw'umuyobozi kugira ngo uhindure izi nshyirahamwe."
            secondaryClassName="text-xs text-neutral-3"
          />
        }
      >
        <p className="text-sm text-neutral-2">
          <BilingualText
            primary="Contact your system administrator if you need elevated access. You can still manage your assigned SACCO from the other tabs."
            secondary="Vugana n'umuyobozi wa sisitemu niba ukeneye uburenganzira bwo hejuru. Uracyashobora gucunga SACCO washinzwe ukoresheje izindi paji."
            secondaryClassName="text-xs text-neutral-3"
          />
        </p>
      </GlassCard>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: saccos } = await supabase
    .from("saccos")
    .select("id, name, district, province, sector, status, bnr_index, email, category, merchant_code, brand_color, sms_sender, logo_url, pdf_header_text, pdf_footer_text")
    .order("name", { ascending: true });

  const { data: users } = await supabase
    .from("users")
    .select("id, email, role, sacco_id, created_at, saccos(name)")
    .order("created_at", { ascending: false })
    .limit(25);

  const { data: notificationQueue } = await supabase
    .from("notification_queue")
    .select("id, event, sacco_id, template_id, status, scheduled_for, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  type UserRow = {
    id: string;
    email: string;
    role: Database["public"]["Enums"]["app_role"];
    sacco_id: string | null;
    created_at: string | null;
    saccos: { name: string | null } | null;
  };

  type SaccoRow = Database["public"]["Tables"]["saccos"]["Row"];

  type NotificationRow = {
    id: string;
    event: string;
    sacco_id: string | null;
    template_id: string | null;
    status: string | null;
    scheduled_for: string | null;
    created_at: string | null;
  };

  const saccoList = (saccos ?? []) as SaccoRow[];
  const notificationRows = (notificationQueue ?? []) as NotificationRow[];

  const normalizedUsers = ((users ?? []) as UserRow[]).map((user) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    sacco_id: user.sacco_id ?? null,
    sacco_name: user.saccos?.name ?? null,
    created_at: user.created_at,
  }));

  const saccoOptions = saccoList.map((sacco) => ({ id: sacco.id, name: sacco.name }));
  const saccoLookup = new Map(saccoOptions.map((option) => [option.id, option.name]));
  const templateLookup = new Map<string, string>();

  if (notificationRows.length > 0) {
    const templateIds = Array.from(new Set(notificationRows.map((row) => row.template_id).filter((value): value is string => Boolean(value))));
    if (templateIds.length > 0) {
      const { data: templateMeta } = await supabase
        .from("sms_templates")
        .select("id, name")
        .in("id", templateIds);
      (templateMeta ?? []).forEach((template) => {
        const typed = template as { id: string; name: string | null };
        templateLookup.set(typed.id, typed.name ?? typed.id);
      });
    }
  }

  return (
    <div className="space-y-8">
      <GradientHeader
        title={<BilingualText primary="Administration" secondary="Ubuyobozi" />}
        subtitle={
          <BilingualText
            primary="Manage SACCO metadata, staff access, and forthcoming branding/SMS templates."
            secondary="Tunganya amakuru ya SACCO, uburenganzira bw'abakozi n'inyandiko z'ubutumire na SMS."
            secondaryClassName="text-xs text-ink/70"
          />
        }
        badge={<StatusChip tone="neutral">System Admin</StatusChip>}
      />

      <GlassCard
        title={<BilingualText primary="Invite a staff member" secondary="Tumira umukozi" />}
        subtitle={
          <BilingualText
            primary="Send credentials and map roles to SACCOs instantly."
            secondary="Ohereza uburenganzira hanyuma uhuze inshingano na SACCO ako kanya."
            secondaryClassName="text-xs text-neutral-3"
          />
        }
      >
        <InviteUserForm />
      </GlassCard>

      <GlassCard
        title={<BilingualText primary="SACCO Registry" secondary="Urutonde rwa SACCO" />}
        subtitle={
          <BilingualText
          primary={`${saccoList.length} Umurenge SACCOs in the dataset.`}
          secondary={`${saccoList.length} Umurenge SACCOs ziri muri sisitemu.`}
            secondaryClassName="text-xs text-neutral-3"
          />
        }
      >
        <SaccoRegistryManager initialSaccos={saccoList} />
      </GlassCard>

      <GlassCard
        title={<BilingualText primary="Branding & logos" secondary="Ibimenyetso n'amabendera" />}
        subtitle={
          <BilingualText
            primary="Upload SACCO logos and update brand accents for downstream portals."
            secondary="Shyiraho ibirango bya SACCO kandi uvugurure amabara ku mbuga zindi."
            secondaryClassName="text-xs text-neutral-3"
          />
        }
      >
        {saccoList.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {saccoList.slice(0, 6).map((sacco) => (
              <SaccoBrandingCard key={sacco.id} sacco={sacco} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-2">No SACCOs available yet.</p>
        )}
      </GlassCard>

      <GlassCard
        title={<BilingualText primary="SMS templates" secondary="Imiterere y'ubutumwa" />}
        subtitle={
          <BilingualText
            primary="Draft and activate outbound communication scripts per SACCO."
            secondary="Tegura no gutangiza ubutumwa bugenewe buri SACCO."
            secondaryClassName="text-xs text-neutral-3"
          />
        }
      >
        {saccoList.length > 0 ? (
          <SmsTemplatePanel
            saccos={saccoList.map((sacco) => ({ id: sacco.id, name: sacco.name }))}
          />
        ) : (
          <p className="text-sm text-neutral-2">Add a SACCO first to manage templates.</p>
        )}
      </GlassCard>

      <GlassCard
        title={<BilingualText primary="Notification queue" secondary="Urutonde rw'ubutumire" />}
        subtitle={
          <BilingualText
            primary="Review recent notification events and pending deliveries."
            secondary="Reba ubutumwa buheruka kubikwa no guteganyirizwa." 
            secondaryClassName="text-xs text-neutral-3"
          />
        }
      >
        <NotificationQueueTable rows={notificationRows} saccoLookup={saccoLookup} templateLookup={templateLookup} />
      </GlassCard>

      <GlassCard
        title={<BilingualText primary="User Access" secondary="Uburenganzira bw'abakozi" />}
        subtitle={
          <BilingualText
            primary={`${users?.length ?? 0} recent staff records.`}
            secondary={`${users?.length ?? 0} abakozi baheruka kwiyandikisha.`}
            secondaryClassName="text-xs text-neutral-3"
          />
        }
      >
        <UserAccessTable users={normalizedUsers} saccos={saccoOptions} />
      </GlassCard>
    </div>
  );
}
