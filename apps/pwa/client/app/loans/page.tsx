"use client";

import { useState, useEffect } from "react";
import { LoanProduct } from "@/lib/types/supa-app";
import { LoanProductCard } from "@/components/loans/loan-product-card";
import { GradientHeader } from "@ibimina/ui";
import { ErrorState, EmptyState } from "@/components/ui/error-state";
import { Briefcase } from "lucide-react";

/**
 * Loans Page
 *
 * Browse available loan products from SACCO/MFI partners.
 * Feature-flagged page that only appears when loans domain is enabled.
 */
export default function LoansPage() {
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("/api/loans/products");
        if (!response.ok) {
          throw new Error("Failed to fetch loan products");
        }
        const data = await response.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error("Error fetching loan products:", err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const handleApply = (product: LoanProduct) => {
    // TODO: Navigate to application form or open modal
    // TODO(client-lint): Replace with client-side analytics/logging
    // eslint-disable-next-line ibimina/structured-logging
    console.log("Apply for loan:", product.id);
    alert(`Apply for ${product.name} - Application flow coming soon!`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-12 w-12 animate-spin text-atlas-blue mb-4" />
        <p className="text-neutral-700">Loading loan products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState error={error} reset={() => window.location.reload()} className="min-h-screen" />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 pb-20">
      <div className="mx-auto max-w-screen-xl space-y-6 px-4 py-6">
        <GradientHeader
          title="Loan Products"
          subtitle="Browse and apply for loans from partner SACCOs and MFIs"
        />

        {products.length === 0 ? (
          <EmptyState
            title="No Loans Available"
            message="No loan products are available at the moment. Check back later or contact your SACCO for more information."
            icon={<Briefcase className="w-8 h-8 text-neutral-400" />}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <LoanProductCard key={product.id} product={product} onApply={handleApply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
