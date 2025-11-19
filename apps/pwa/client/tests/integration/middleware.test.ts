import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";
import { middleware, hasSupabaseSessionCookie, isPublicPath } from "@/middleware";

const createRequest = (path: string, cookie?: string) =>
  new NextRequest(`http://localhost:5000${path}`, {
    headers: cookie ? { cookie } : undefined,
  });

describe("middleware route guards", () => {
  it("identifies Supabase session cookies", () => {
    const request = createRequest("/home", "sb-access-token=abc");
    assert.equal(hasSupabaseSessionCookie(request), true);
    const none = createRequest("/home");
    assert.equal(hasSupabaseSessionCookie(none), false);
  });

  it("allows public paths to bypass auth", () => {
    assert.equal(isPublicPath("/login"), true);
    assert.equal(isPublicPath("/help/faq"), true);
    assert.equal(isPublicPath("/dashboard"), false);
  });

  it("redirects unauthenticated users to login", () => {
    const response = middleware(createRequest("/home"));
    assert.ok(response instanceof Response);
    assert.equal((response as Response).status, 307);
    assert.equal(
      (response as Response).headers.get("location"),
      "http://localhost:5000/login?redirectedFrom=/home"
    );
  });

  it("passes through when session cookie is present", () => {
    const response = middleware(createRequest("/home", "sb-access-token=abc"));
    assert.ok(response instanceof Response);
    assert.equal((response as Response).status, 200);
    assert.equal((response as Response).headers.get("x-request-id")?.length ?? 0 > 0, true);
  });
});
