import { NextRequest, NextResponse } from "next/server";
import { supabaseSrv } from "@/lib/supabase/server";
import { InviteAcceptReq } from "@/lib/validators";

type Dependencies = {
  supabaseSrv: typeof supabaseSrv;
  inviteValidator: typeof InviteAcceptReq;
};

const defaultDeps: Dependencies = { supabaseSrv, inviteValidator: InviteAcceptReq };

export function createInviteAcceptHandler(overrides: Partial<Dependencies> = {}) {
  const deps: Dependencies = { ...defaultDeps, ...overrides } as Dependencies;

  return async function POST(req: NextRequest) {
    const srv = deps.supabaseSrv();

    const client = srv as any;
    const {
      data: { user },
      error: authError,
    } = await srv.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = deps.inviteValidator.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { token } = parsed.data;
    const { data: invite, error } = await client
      .from("group_invites")
      .select("id, group_id, status")
      .eq("token", token)
      .maybeSingle();

    if (error || !invite) {
      return NextResponse.json({ error: error?.message ?? "Invalid token" }, { status: 400 });
    }

    if (invite.status !== "sent") {
      return NextResponse.json({ error: "Invite already used/expired" }, { status: 400 });
    }

    const { error: updateError } = await client
      .from("group_invites")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        invitee_user_id: user.id,
      })
      .eq("id", invite.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, pending_staff_approval: true });
  };
}

export const POST = createInviteAcceptHandler();
