import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface FraudAlert {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  type: string;
  description: string;
  confidence: number;
  status: string;
  created_at: string;
}

interface DocumentScan {
  id: string;
  file_name: string;
  document_type: string;
  confidence: number;
  status: string;
  created_at: string;
}

export function useRealtimeFraudAlerts() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("fraud_alerts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "fraud_alerts",
          filter: "status=eq.pending",
        },
        (payload) => {
          const newAlert = payload.new as FraudAlert;
          setAlerts((prev) => [newAlert, ...prev]);

          if (newAlert.severity === "critical" || newAlert.severity === "high") {
            toast.error(`Fraud Alert: ${newAlert.description}`, {
              duration: 10000,
              action: {
                label: "View",
                onClick: () => (window.location.href = "/security"),
              },
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { alerts, error };
}

export function useRealtimeDocumentScans() {
  const [scans, setScans] = useState<DocumentScan[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("document_scans")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "document_scans",
        },
        (payload) => {
          const newScan = payload.new as DocumentScan;
          setScans((prev) => [newScan, ...prev]);

          if (newScan.status === "processed") {
            toast.success(`Document scanned: ${newScan.file_name}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { scans, error };
}
