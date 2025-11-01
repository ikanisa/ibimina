"use client";

import Image from "next/image";
import { LoanProduct } from "@/lib/types/supa-app";
import { fmtCurrency } from "@/utils/format";
import { CreditCard, Calendar, TrendingUp, FileText } from "lucide-react";

interface LoanProductCardProps {
  product: LoanProduct;
  onApply?: (product: LoanProduct) => void;
}

/**
 * LoanProductCard Component
 *
 * Displays a loan product offer card with partner info, terms, and apply button.
 * Fully accessible with WCAG 2.1 AA compliance.
 *
 * @param product - Loan product details
 * @param onApply - Callback when user clicks "Apply Now"
 */
export function LoanProductCard({ product, onApply }: LoanProductCardProps) {
  const formatAmount = (amount: number) => fmtCurrency(amount);

  return (
    <div
      className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
      role="article"
      aria-labelledby={`loan-product-${product.id}`}
    >
      {/* Header with partner logo and name */}
      <div className="flex items-start gap-4 mb-4">
        {product.partner_logo_url && (
          <Image
            src={product.partner_logo_url}
            alt={`${product.partner_name} logo`}
            width={64}
            height={64}
            className="h-16 w-16 rounded object-contain"
            unoptimized
          />
        )}
        <div className="flex-1">
          <h3
            id={`loan-product-${product.id}`}
            className="text-xl font-semibold text-gray-900 mb-1"
          >
            {product.name}
          </h3>
          {product.partner_name && (
            <p className="text-sm text-gray-600">by {product.partner_name}</p>
          )}
        </div>
      </div>

      {/* Description */}
      {product.description && <p className="text-gray-700 mb-4">{product.description}</p>}

      {/* Key details grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-start gap-2">
          <CreditCard className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-xs text-gray-600 font-medium">Amount Range</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatAmount(product.min_amount)} - {formatAmount(product.max_amount)}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-xs text-gray-600 font-medium">Tenor</p>
            <p className="text-sm font-semibold text-gray-900">
              {product.min_tenor_months} - {product.max_tenor_months} months
            </p>
          </div>
        </div>

        {product.interest_rate && (
          <div className="flex items-start gap-2 col-span-2">
            <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs text-gray-600 font-medium">Interest Rate</p>
              <p className="text-sm font-semibold text-gray-900">
                {product.interest_rate}%
                {product.interest_rate_description && (
                  <span className="text-xs text-gray-600 ml-2">
                    ({product.interest_rate_description})
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Required documents */}
      {product.required_documents && product.required_documents.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-gray-600" aria-hidden="true" />
            <p className="text-sm font-medium text-gray-700">Required Documents:</p>
          </div>
          <ul className="text-sm text-gray-600 list-disc list-inside">
            {product.required_documents.map((doc, index) => (
              <li key={index}>{doc}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Eligibility criteria */}
      {product.eligibility_criteria && (
        <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs font-medium text-blue-900 mb-1">Eligibility</p>
          <p className="text-sm text-blue-800">{product.eligibility_criteria}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => onApply?.(product)}
          className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors min-h-[48px]"
          aria-label={`Apply for ${product.name}`}
        >
          Apply Now
        </button>
        {product.terms_url && (
          <a
            href={product.terms_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors min-h-[48px] flex items-center"
            aria-label="View full terms and conditions"
          >
            T&Cs
          </a>
        )}
      </div>
    </div>
  );
}
