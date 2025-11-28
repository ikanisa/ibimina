"use client";

import { DocumentScanner } from "@/components/documents/DocumentScanner";
import { ScanHistory } from "@/components/documents/ScanHistory";

export default function DocumentsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Document Intelligence</h1>
        <p className="text-text-muted">Scan and extract data from receipts, IDs, and statements</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DocumentScanner />
        <ScanHistory />
      </div>
    </div>
  );
}
