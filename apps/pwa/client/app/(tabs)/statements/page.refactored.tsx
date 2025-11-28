/**
 * Refactored Statements Page using Modern Design System
 * 
 * Improvements:
 * - Uses Stack, Container, AnimatedPage for layout
 * - Uses DataCard for empty states
 * - Cleaner, more maintainable code
 * - Better responsive design
 */

import type { StatementEntry } from "@/components/statements/statements-table";
import { AnimatedPage, Container, Stack, EmptyState } from "@ibimina/ui";
import { FileText } from "lucide-react";
import { loadStatements } from "@/lib/data/statements";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { StatementsTableLazy } from "@/components/statements/statements-table.lazy";

export const metadata = {
  title: "Statements | SACCO+ Client",
  description: "View your transaction history and statements",
};

async function exportStatements(period: string) {
  "use server";
  const supabase = await createSupabaseServerClient();
  try {
    await supabase.functions.invoke("export-report", {
      body: {
        report: "member_allocations",
        format: "pdf",
        period,
      },
    });
  } catch (error) {
    console.error("Failed to request statement export", error);
    throw new Error("We could not start the export. Please try again later.");
  }
}

export default async function StatementsPage() {
  const data = await loadStatements();

  const handleExportPDF = async (period: string) => {
    "use server";
    await exportStatements(period);
  };

  return (
    <AnimatedPage>
      <Container size="xl">
        <Stack gap="lg" className="min-h-screen pb-20">
          {/* Header */}
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur py-6">
            <h1 className="text-2xl font-bold">My Statements</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              View your transaction history and export statements
            </p>
          </header>

          {/* Content */}
          <main>
            {data.entries.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No statements available"
                description="Make your first contribution to see statements here"
                className="py-12"
              />
            ) : (
              <StatementsTableLazy
                entries={data.entries as StatementEntry[]}
                onExportPDF={handleExportPDF}
              />
            )}
          </main>

          {/* Info Card */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
            <h2 className="mb-3 text-base font-semibold">About your statements</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  <strong className="text-foreground">Confirmed:</strong> Payments verified and allocated
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  <strong className="text-foreground">Pending:</strong> Waiting for provider confirmation
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  <strong className="text-foreground">Export:</strong> Download PDF reports any time
                </span>
              </li>
            </ul>
          </div>
        </Stack>
      </Container>
    </AnimatedPage>
  );
}
