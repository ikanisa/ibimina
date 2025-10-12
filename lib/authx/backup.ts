import { consumeBackupCode } from "@/lib/mfa";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const consumeBackup = async (userId: string, code: string) => {
  if (!code) return false;

  const supabase = createSupabaseAdminClient();
  type UserRow = { mfa_backup_hashes: string[] | null };

  const { data, error } = await supabase
    .from("users")
    .select("mfa_backup_hashes")
    .eq("id", userId)
    .maybeSingle();

  const userRow = data as UserRow | null;

  if (error || !userRow) {
    console.error("consumeBackup: failed to read user", error);
    return false;
  }

  const hashes = Array.isArray(userRow.mfa_backup_hashes) ? userRow.mfa_backup_hashes : [];
  if (hashes.length === 0) return false;

  const next = consumeBackupCode(code, hashes);
  if (!next) return false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from("users")
    .update({ mfa_backup_hashes: next })
    .eq("id", userId);
  if (updateError) {
    console.error("consumeBackup: failed to persist", updateError);
    return false;
  }

  return true;
};
