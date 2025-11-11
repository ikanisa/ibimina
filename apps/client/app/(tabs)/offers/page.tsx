/**
 * Offers Page - Feature flagged partner benefits
 */

import { Sparkles } from "lucide-react";

import { loadOffers } from "@/lib/data/offers";
import { loadFeatureFlags } from "@/lib/feature-flags/service";

export const metadata = {
  title: "Offers | SACCO+ Client",
  description: "View partner offers available to your group",
};

export default async function OffersPage() {
  const featureFlags = await loadFeatureFlags();
  const offersEnabled = featureFlags["offers-enabled"] === true;

  if (!offersEnabled) {
    return (
      <div className="min-h-screen bg-neutral-50 pb-20">
        <main className="mx-auto max-w-screen-sm px-4 py-16">
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-neutral-400" aria-hidden="true" />
            <h1 className="mt-4 text-xl font-semibold text-neutral-900">Offers coming soon</h1>
            <p className="mt-2 text-sm text-neutral-700">
              Your SACCO is preparing member offers. Check back later or update to the latest app
              release.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const data = await loadOffers();

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <header className="bg-white border-b border-neutral-200">
        <div className="mx-auto max-w-screen-xl px-4 py-6">
          <h1 className="text-2xl font-bold text-neutral-900">Member offers</h1>
          <p className="mt-1 text-sm text-neutral-700">
            Exclusive benefits curated for {data.saccoName ?? "your SACCO"}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-screen-xl px-4 py-6 space-y-6">
        {data.features.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
            <p className="text-neutral-700">
              No offers available yet. Your SACCO will notify you when benefits go live.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {data.features.map((feature) => (
              <article
                key={feature.id}
                className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-atlas-blue" aria-hidden="true" />
                  <h2 className="text-lg font-semibold text-neutral-900">{feature.title}</h2>
                </div>
                <p className="mt-3 text-sm text-neutral-700">{feature.description}</p>
              </article>
            ))}
          </div>
        )}

        {data.contact ? (
          <div className="rounded-2xl border border-atlas-blue/20 bg-atlas-glow p-6">
            <h2 className="text-base font-semibold text-atlas-blue-dark">
              Need help activating offers?
            </h2>
            <p className="mt-2 text-sm text-neutral-700">Contact your SACCO partnership team:</p>
            <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-white/80 p-4 text-sm text-neutral-800">
              {JSON.stringify(data.contact, null, 2)}
            </pre>
          </div>
        ) : null}
      </main>
    </div>
  );
}
