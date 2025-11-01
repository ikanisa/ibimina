/**
 * Statements Table Component
 *
 * Displays allocation-based transaction statements with filtering and export capabilities.
 *
 * Features:
 * - Date filters (This Month, Last Month, Custom)
 * - Entry rows with date, amount, transaction ID, status
 * - Status badges (CONFIRMED, PENDING)
 * - PDF export functionality
 * - Large, readable text
 * - Mobile-first responsive design
 */

"use client";

import { useState } from "react";
import { Calendar, Download, ChevronDown } from "lucide-react";
import { fmtCurrency } from "@/utils/format";

export interface StatementEntry {
  id: string;
  date: string;
  amount: number;
  txnId: string;
  status: "CONFIRMED" | "PENDING";
  groupName: string;
  reference: string;
}

interface StatementsTableProps {
  entries: StatementEntry[];
  onExportPDF?: (period: string) => void;
}

export function StatementsTable({ entries, onExportPDF }: StatementsTableProps) {
  const [filter, setFilter] = useState<"this-month" | "last-month" | "custom">("this-month");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter entries based on selected period
  const filteredEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.date);
    const now = new Date();

    if (filter === "this-month") {
      return (
        entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear()
      );
    } else if (filter === "last-month") {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return (
        entryDate.getMonth() === lastMonth.getMonth() &&
        entryDate.getFullYear() === lastMonth.getFullYear()
      );
    }
    return true;
  });

  // Calculate totals
  const totalAmount = filteredEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const confirmedCount = filteredEntries.filter((e) => e.status === "CONFIRMED").length;
  const pendingCount = filteredEntries.filter((e) => e.status === "PENDING").length;

  const handleExport = () => {
    if (onExportPDF) {
      const periodName =
        filter === "this-month"
          ? "This Month"
          : filter === "last-month"
            ? "Last Month"
            : "Custom Period";
      onExportPDF(periodName);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Header with Filter and Export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 min-h-[48px] px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Filter statements by period"
            aria-expanded={isFilterOpen}
          >
            <Calendar className="w-5 h-5 text-gray-600" aria-hidden="true" />
            <span className="text-sm font-medium text-gray-900">
              {filter === "this-month"
                ? "This Month"
                : filter === "last-month"
                  ? "Last Month"
                  : "Custom"}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-600" aria-hidden="true" />
          </button>

          {isFilterOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <button
                onClick={() => {
                  setFilter("this-month");
                  setIsFilterOpen(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm font-medium text-gray-900 focus:outline-none focus:bg-gray-50"
              >
                This Month
              </button>
              <button
                onClick={() => {
                  setFilter("last-month");
                  setIsFilterOpen(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm font-medium text-gray-900 focus:outline-none focus:bg-gray-50"
              >
                Last Month
              </button>
              <button
                onClick={() => {
                  setFilter("custom");
                  setIsFilterOpen(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm font-medium text-gray-900 rounded-b-lg focus:outline-none focus:bg-gray-50"
              >
                Custom Period
              </button>
            </div>
          )}
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          className="flex items-center gap-2 min-h-[48px] px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Export statements as PDF"
        >
          <Download className="w-5 h-5" aria-hidden="true" />
          <span>Export PDF</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{fmtCurrency(totalAmount)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Confirmed</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{confirmedCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
        </div>
      </div>

      {/* Statements List */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No statements found for the selected period.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Group
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Txn ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {new Intl.DateTimeFormat("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(entry.date))}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">{entry.groupName}</td>
                    <td className="px-4 py-4 text-right text-sm font-semibold text-gray-900">
                      {fmtCurrency(entry.amount)}
                    </td>
                    <td className="px-4 py-4 text-sm font-mono text-gray-600">{entry.txnId}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`
                          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${
                            entry.status === "CONFIRMED"
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                          }
                        `}
                      >
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
