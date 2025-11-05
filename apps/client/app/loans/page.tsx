"use client";

import { useState, useEffect } from "react";
import { LoanProduct } from "@/lib/types/supa-app";
import { LoanProductCard } from "@/components/loans/loan-product-card";
import { GradientHeader } from "@ibimina/ui";
import { Loader2, AlertCircle } from "lucide-react";

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
        setError("Unable to load loan products. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const handleApply = (product: LoanProduct) => {
    // TODO: Navigate to application form or open modal
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
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
        <p className="mb-2 font-semibold text-neutral-900">Error</p>
        <p className="text-center text-neutral-700">{error}</p>
      </div>
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
          <div className="py-12 text-center">
            <p className="text-neutral-700">No loan products available at the moment.</p>
            <p className="mt-2 text-sm text-neutral-700">
              Check back later or contact your SACCO for more information.
            </p>
          </div>
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
