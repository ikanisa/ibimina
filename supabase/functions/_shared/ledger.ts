import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

type AnyClient = SupabaseClient<any, any, any>;

type Payment = {
  id: string;
  sacco_id: string;
  ikimina_id: string | null;
  member_id: string | null;
  amount: number;
  currency: string;
  txn_id: string;
};

const ensureAccount = async (supabase: AnyClient, ownerType: string, ownerId: string, currency = "RWF") => {
  const { data, error } = await supabase
    .from("accounts")
    .select("id")
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId)
    .eq("currency", currency)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data?.id) {
    return data.id as string;
  }

  const { data: created, error: createError } = await supabase
    .from("accounts")
    .insert({
      owner_type: ownerType,
      owner_id: ownerId,
      currency,
      status: "ACTIVE",
    })
    .select("id")
    .single();

  if (createError) {
    throw createError;
  }

  return created.id as string;
};

export const postToLedger = async (supabase: AnyClient, payment: Payment) => {
  if (!payment.ikimina_id) {
    throw new Error("Payment missing ikimina");
  }

  const clearingAccountId = await ensureAccount(supabase, "MOMO_CLEARING", payment.sacco_id);
  const ikiminaAccountId = await ensureAccount(supabase, "IKIMINA", payment.ikimina_id);

  const { data: existing, error: fetchError } = await supabase
    .from("ledger_entries")
    .select("id")
    .eq("external_id", payment.id)
    .eq("memo", "POSTED")
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (existing?.id) {
    return existing.id as string;
  }

  const { data: entry, error: insertError } = await supabase
    .from("ledger_entries")
    .insert({
      debit_id: clearingAccountId,
      credit_id: ikiminaAccountId,
      amount: payment.amount,
      currency: payment.currency,
      value_date: new Date().toISOString(),
      external_id: payment.id,
      memo: "POSTED",
    })
    .select("id")
    .single();

  if (insertError) {
    throw insertError;
  }

  return entry.id as string;
};

export const settleLedger = async (supabase: AnyClient, payment: Payment) => {
  const clearingAccountId = await ensureAccount(supabase, "MOMO_CLEARING", payment.sacco_id);
  const settlementAccountId = await ensureAccount(supabase, "MOMO_SETTLEMENT", payment.sacco_id);

  const { data: existing, error: fetchError } = await supabase
    .from("ledger_entries")
    .select("id")
    .eq("external_id", payment.id)
    .eq("memo", "SETTLED")
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (existing?.id) {
    return existing.id as string;
  }

  const { data: entry, error: insertError } = await supabase
    .from("ledger_entries")
    .insert({
      debit_id: settlementAccountId,
      credit_id: clearingAccountId,
      amount: payment.amount,
      currency: payment.currency,
      value_date: new Date().toISOString(),
      external_id: payment.id,
      memo: "SETTLED",
    })
    .select("id")
    .single();

  if (insertError) {
    throw insertError;
  }

  return entry.id as string;
};
