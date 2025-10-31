"use client";

import { useState, useEffect } from "react";
import { LoanProduct } from "@/lib/types/supa-app";
import { LoanProductCard } from "@/components/loans/loan-product-card";
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
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading loan products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
        <p className="text-gray-900 font-semibold mb-2">Error</p>
        <p className="text-gray-600 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Loan Products</h1>
          <p className="text-sm text-gray-600 mt-1">
            Browse and apply for loans from partner SACCOs and MFIs
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No loan products available at the moment.</p>
            <p className="text-sm text-gray-500 mt-2">
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
