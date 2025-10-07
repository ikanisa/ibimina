import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptField, hashField, maskMsisdn, maskNationalId } from "../_shared/crypto.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";
import { writeAuditLog } from "../_shared/audit.ts";
import { recordMetric } from "../_shared/metrics.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MemberPayload {
  fullName: string;
  msisdn: string;
  nationalId?: string | null;
  memberCode?: string | null;
}

interface ImportRequest {
  ikiminaId: string;
  members: MemberPayload[];
  actorId?: string | null;
}

const normalizeMsisdn = (value: string) => {
  const digits = value.replace(/[^0-9+]/g, "");
  if (digits.startsWith("+")) {
    return digits;
  }
  if (digits.startsWith("2507")) {
    return `+${digits}`;
  }
  if (digits.startsWith("07")) {
    return `+250${digits.slice(2)}`;
  }
  return value;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Missing authorization" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const payload = (await req.json()) as ImportRequest;

    if (!payload.ikiminaId || !payload.members?.length) {
      throw new Error("Ikimina ID and members are required");
    }

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role, sacco_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      console.error("Failed to load user profile", profileError);
      return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const { data: ikimina, error: ikiminaError } = await supabase
      .from("ibimina")
      .select("id, sacco_id")
      .eq("id", payload.ikiminaId)
      .maybeSingle();

    if (ikiminaError) {
      console.error("Failed to load ikimina", ikiminaError);
      throw ikiminaError;
    }

    if (!ikimina) {
      return new Response(JSON.stringify({ success: false, error: "Ikimina not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const isSystemAdmin = profile.role === "SYSTEM_ADMIN";
    const sharesSacco = Boolean(profile.sacco_id && profile.sacco_id === ikimina.sacco_id);

    if (!isSystemAdmin && !sharesSacco) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const allowed = await enforceRateLimit(supabase, `members:${payload.ikiminaId}`, {
      maxHits: Math.max(payload.members.length, 10),
    });

    if (!allowed) {
      return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429,
      });
    }

    const records: Record<string, unknown>[] = [];

    for (const member of payload.members) {
      const msisdn = normalizeMsisdn(member.msisdn);
      const encryptedMsisdn = await encryptField(msisdn);
      const msisdnHash = await hashField(msisdn);
      const maskedMsisdn = maskMsisdn(msisdn);

      const nationalId = member.nationalId?.trim() || null;
      const encryptedNid = await encryptField(nationalId ?? null);
      const nidHash = await hashField(nationalId ?? null);
      const maskedNid = maskNationalId(nationalId ?? null);

      records.push({
        ikimina_id: payload.ikiminaId,
        full_name: member.fullName,
        member_code: member.memberCode ?? null,
        status: "ACTIVE",
        msisdn: maskedMsisdn,
        msisdn_encrypted: encryptedMsisdn,
        msisdn_hash: msisdnHash,
        msisdn_masked: maskedMsisdn,
        national_id_encrypted: encryptedNid,
        national_id_hash: nidHash,
        national_id_masked: maskedNid,
      });
    }

    const { error } = await supabase.from("ikimina_members").insert(records);

    if (error) {
      throw error;
    }

    await writeAuditLog(supabase, {
      actorId: user.id,
      action: "MEMBER_IMPORT",
      entity: "IKIMINA",
      entityId: payload.ikiminaId,
      diff: { imported: records.length },
    });

    await recordMetric(supabase, "members_imported", records.length, {
      ikiminaId: payload.ikiminaId,
    });

    return new Response(
      JSON.stringify({ success: true, inserted: records.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("secure-import-members error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
