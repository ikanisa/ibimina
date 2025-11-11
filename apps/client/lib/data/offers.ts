import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchReferenceTokens } from "@ibimina/data-access";

interface FeatureDefinition {
  id: string;
  title: string;
  description: string;
}

const FEATURE_CATALOG: Record<string, FeatureDefinition> = {
  loans: {
    id: "loans",
    title: "Loan products",
    description: "Access working capital loans tailored to your ikimina's repayment history.",
  },
  insurance: {
    id: "insurance",
    title: "Insurance cover",
    description: "Opt-in micro-insurance benefits for your members with transparent premiums.",
  },
  wallet: {
    id: "wallet",
    title: "Mobile wallet",
    description: "Safely store dividends and payouts in a SACCO-backed digital wallet.",
  },
  marketplace: {
    id: "marketplace",
    title: "Member marketplace",
    description: "Unlock curated partner discounts for agriculture inputs and business supplies.",
  },
};

export interface OfferEntry extends FeatureDefinition {}

export interface OffersData {
  saccoId: string | null;
  saccoName: string | null;
  features: OfferEntry[];
  contact: Record<string, unknown> | null;
}

export async function loadOffers(): Promise<OffersData> {
  const supabase = await createSupabaseServerClient();
  const tokens = await fetchReferenceTokens(supabase);
  const primaryToken = tokens.find((token) => Boolean(token.saccoId));

  const saccoId = primaryToken?.saccoId ?? null;
  let saccoName: string | null = null;

  if (saccoId) {
    const { data: sacco } = await supabase
      .from("saccos")
      .select("name")
      .eq("id", saccoId)
      .maybeSingle();
    saccoName = (sacco as { name?: string } | null)?.name ?? null;
  }

  const { data: partnerConfig, error } = saccoId
    ? await supabase
        .from("partner_config")
        .select("enabled_features, contact")
        .eq("org_id", saccoId)
        .maybeSingle()
    : { data: null, error: null };

  if (error) {
    console.error("Failed to load partner configuration", error);
  }

  const enabledFeatures = Array.isArray(
    (partnerConfig as { enabled_features?: unknown[] } | null)?.enabled_features
  )
    ? ((partnerConfig as { enabled_features?: string[] } | null)?.enabled_features ?? [])
    : [];

  const features = enabledFeatures
    .map((key) => FEATURE_CATALOG[key])
    .filter((feature): feature is FeatureDefinition => Boolean(feature));

  return {
    saccoId,
    saccoName,
    features,
    contact: (partnerConfig as { contact?: Record<string, unknown> } | null)?.contact ?? null,
  };
}
