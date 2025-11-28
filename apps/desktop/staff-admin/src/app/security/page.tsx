"use client";

import { FraudAlertList } from "@/components/fraud/FraudAlertList";
import { FraudStats } from "@/components/fraud/FraudStats";

export default function SecurityPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Fraud Detection</h1>
        <p className="text-text-muted">Monitor and manage fraud alerts</p>
      </div>

      <FraudStats />
      <FraudAlertList />
    </div>
  );
}
