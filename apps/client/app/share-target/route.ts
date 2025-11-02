import { NextRequest, NextResponse } from "next/server";

const sanitize = (value: FormDataEntryValue | null): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed.length) {
    return null;
  }

  return trimmed.slice(0, 1024);
};

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const title = sanitize(formData.get("title"));
  const text = sanitize(formData.get("text"));
  const url = sanitize(formData.get("url"));

  const params = new URLSearchParams();
  if (title) params.set("title", title);
  if (text) params.set("text", text);
  if (url) params.set("url", url);

  const redirect = new URL("/share", request.url);
  if ([...params.keys()].length) {
    redirect.search = params.toString();
  }

  return NextResponse.redirect(redirect, { status: 303 });
}
