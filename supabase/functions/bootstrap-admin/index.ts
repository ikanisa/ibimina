import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const adminEmailRaw = (Deno.env.get("ADMIN_DEFAULT_EMAIL") ?? "").trim();
    const adminPasswordRaw = Deno.env.get("ADMIN_DEFAULT_PASSWORD") ?? "";
    const adminNameRaw = (Deno.env.get("ADMIN_DEFAULT_NAME") ?? "").trim();
    const adminEmail = adminEmailRaw.length > 0 ? adminEmailRaw : "info@ikanisa.com";
    const adminPassword = adminPasswordRaw.length > 0 ? adminPasswordRaw : "MoMo!!0099";
    const adminName = adminNameRaw.length > 0 ? adminNameRaw : "System Admin";

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if admin already exists
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", adminEmail)
      .single();

    if (existing) {
      const existingId = (existing as { id: string }).id;
      try {
        const { data: existingUser, error: existingUserError } = await supabase.auth.admin.getUserById(existingId);
        if (existingUserError) {
          console.warn("[bootstrap-admin] unable to load existing admin user", existingUserError);
        } else {
          const currentMeta = (existingUser?.user?.user_metadata ?? {}) as Record<string, unknown>;
          const currentName = typeof currentMeta.full_name === "string" ? currentMeta.full_name.trim() : "";
          if (!currentName) {
            await supabase.auth.admin.updateUserById(existingId, {
              user_metadata: { ...currentMeta, full_name: adminName },
            });
          }
        }
      } catch (updateError) {
        console.warn("[bootstrap-admin] failed to sync admin metadata", updateError);
      }
      return new Response(
        JSON.stringify({ message: "Admin user already exists" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the admin user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { full_name: adminName },
    });

    if (authError || !authData.user) {
      throw authError || new Error("Failed to create user");
    }

    // Update user role to SYSTEM_ADMIN
    const { error: updateError } = await supabase
      .from("users")
      .update({ role: "SYSTEM_ADMIN" })
      .eq("id", authData.user.id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Admin user created successfully. You can now login."
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Bootstrap error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
