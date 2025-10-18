import type { PostgrestError } from "@supabase/supabase-js";

export function isMissingRelationError(error: PostgrestError | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "42P01") return true;
  const fingerprint = [error.message, error.details, error.hint].filter(Boolean).join(" ");
  return /(?:relation|table).+does not exist/i.test(fingerprint);
}
