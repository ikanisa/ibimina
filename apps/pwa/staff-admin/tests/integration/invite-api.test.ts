import { describe, it, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { createInviteAcceptHandler } from "@/app/api/invite/accept/route";
import { InviteAcceptReq } from "@/lib/validators";

type SupabaseUser = { id: string } | null;

type InviteRecord = {
  id: string;
  group_id: string;
  status: string;
  token: string;
};

type InviteClientOptions = {
  user: SupabaseUser;
  invite?: InviteRecord | null;
  inviteError?: { message: string } | null;
  updateError?: { message: string } | null;
};

function buildRequest(body: unknown) {
  return new NextRequest("http://localhost/api/invite/accept", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

function createInviteClient(options: InviteClientOptions) {
  const { user, invite, inviteError, updateError } = options;
  return {
    auth: {
      getUser: async () => ({ data: { user }, error: user ? null : { message: "nope" } }),
    },
    from(table: string) {
      if (table !== "group_invites") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select: () => ({
          eq: (_column: string, value: string) => ({
            maybeSingle: async () =>
              value === (invite?.token ?? value)
                ? { data: invite ?? null, error: inviteError ?? null }
                : { data: null, error: inviteError ?? null },
          }),
        }),
        update: (_values: Record<string, unknown>) => ({
          eq: async () => ({ error: updateError ?? null }),
        }),
      };
    },
  };
}

describe("invite acceptance API", () => {
  afterEach(() => {
    mock.restoreAll();
    mock.reset();
  });

  it("returns 401 when the user is not authenticated", async () => {
    const client = createInviteClient({ user: null });
    const handler = createInviteAcceptHandler({
      supabaseSrv: () => client as any,
    });

    const response = await handler(buildRequest({ token: "abc" }));
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.error, "Unauthenticated");
  });

  it("rejects malformed payloads before querying Supabase", async () => {
    const client = createInviteClient({ user: { id: "user-1" } });
    const handler = createInviteAcceptHandler({
      supabaseSrv: () => client as any,
    });

    const response = await handler(buildRequest({ token: 123 }));
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(typeof payload.error, "object");
  });

  it("handles missing or already used invites", async () => {
    const client = createInviteClient({
      user: { id: "user-1" },
      invite: { id: "inv-1", group_id: "group-1", status: "accepted", token: "token-1234" },
      inviteError: null,
    });
    const handler = createInviteAcceptHandler({
      supabaseSrv: () => client as any,
    });

    const response = await handler(buildRequest({ token: "token-1234" }));
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.error, "Invite already used/expired");
  });

  it("accepts a valid invite and updates Supabase", async () => {
    let updated = false;
    const client = {
      ...createInviteClient({
        user: { id: "user-1" },
        invite: { id: "inv-1", group_id: "group-1", status: "sent", token: "token-1234" },
        inviteError: null,
      }),
      from(table: string) {
        const base = (
          createInviteClient({
            user: { id: "user-1" },
            invite: { id: "inv-1", group_id: "group-1", status: "sent", token: "token-1234" },
            inviteError: null,
          }) as any
        ).from(table);

        return {
          ...base,
          update: (values: Record<string, unknown>) => ({
            eq: async () => {
              updated = true;
              assert.equal(values.status, "accepted");
              assert.ok(values.accepted_at);
              assert.equal(values.invitee_user_id, "user-1");
              return { error: null };
            },
          }),
        };
      },
    };

    const handler = createInviteAcceptHandler({
      supabaseSrv: () => client as any,
      inviteValidator: {
        safeParse: (body: unknown) => InviteAcceptReq.safeParse(body),
      } as any,
    });

    const response = await handler(buildRequest({ token: "token-1234" }));
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.pending_staff_approval, true);
    assert.equal(updated, true);
  });
});
