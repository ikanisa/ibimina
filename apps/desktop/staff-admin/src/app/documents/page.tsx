'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DocumentIntelligence } from '@/lib/ai/document-intelligence';
import { useAI } from '@/contexts/AIContext';
import { Upload, FileText, CreditCard, Receipt, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function DocumentsPage() {
  const { geminiApiKey, isFeatureEnabled } = useAI();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    if (!geminiApiKey || !isFeatureEnabled('documentScanning')) {
      setError('Document scanning is not enabled');
      return;
    }

    setScanning(true);
    setError(null);
    setResult(null);

    try {
      const docIntel = new DocumentIntelligence(geminiApiKey);
      const scanResult = await docIntel.scanFromFile();
      
      if (scanResult) {
        setResult(scanResult.result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-base p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary-500" />
              Document Intelligence
            </h1>
            <p className="text-text-muted mt-1">
              AI-powered document scanning and extraction
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureCard
            icon={<Receipt className="w-6 h-6" />}
            title="MoMo Receipts"
            description="Extract transaction details automatically"
            color="primary"
          />
          <FeatureCard
            icon={<CreditCard className="w-6 h-6" />}
            title="National IDs"
            description="Scan and verify Rwandan ID cards"
            color="accent"
          />
          <FeatureCard
            icon={<FileText className="w-6 h-6" />}
            title="Bank Statements"
            description="Process statements and extract transactions"
            color="success"
          />
        </div>

        <div className="bg-surface-elevated rounded-xl border border-border-default p-8">
          <div className="flex flex-col items-center justify-center space-y-6">
            <button
              onClick={handleScan}
              disabled={scanning || !isFeatureEnabled('documentScanning')}
              className="flex items-center gap-3 px-8 py-4 bg-primary-500 hover:bg-primary-600 disabled:bg-surface-subtle text-white rounded-lg font-medium transition-colors"
            >
              <Upload className="w-5 h-5" />
              {scanning ? 'Scanning...' : 'Scan Document'}
            </button>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-error-500 bg-error-500/10 px-4 py-3 rounded-lg"
              >
                <AlertCircle className="w-5 h-5" />
                {error}
              </motion.div>
            )}

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full space-y-4"
              >
                <div className="flex items-center gap-2 text-success-500">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Document analyzed successfully</span>
                </div>

                <div className="bg-surface-base rounded-lg border border-border-default p-6 space-y-4">
                  <div>
                    <p className="text-sm text-text-muted">Document Type</p>
                    <p className="text-lg font-semibold text-text-primary capitalize">
                      {result.type.replace('_', ' ')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-text-muted">Confidence</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-surface-subtle rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500"
                          style={{ width: `${result.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {Math.round(result.confidence * 100)}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-text-muted mb-2">Extracted Data</p>
                    <pre className="bg-surface-subtle rounded-lg p-4 text-sm overflow-auto">
                      {JSON.stringify(result.extractedData, null, 2)}
                    </pre>
                  </div>

                  {result.suggestions?.length > 0 && (
                    <div>
                      <p className="text-sm text-text-muted mb-2">Suggestions</p>
                      <ul className="space-y-1">
                        {result.suggestions.map((s: string, i: number) => (
                          <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                            <span className="text-primary-500">•</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.warnings?.length > 0 && (
                    <div>
                      <p className="text-sm text-text-muted mb-2">Warnings</p>
                      <ul className="space-y-1">
                        {result.warnings.map((w: string, i: number) => (
                          <li key={i} className="text-sm text-error-500 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 mt-0.5" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'primary' | 'accent' | 'success';
}) {
  const colors = {
    primary: 'text-primary-500 bg-primary-500/10',
    accent: 'text-accent-500 bg-accent-500/10',
    success: 'text-success-500 bg-success-500/10',
  };

  return (
    <div className="bg-surface-elevated rounded-lg border border-border-default p-6 space-y-3">
      <div className={`w-12 h-12 rounded-lg ${colors[color]} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-text-primary">{title}</h3>
        <p className="text-sm text-text-muted mt-1">{description}</p>
      </div>
    </div>
  );
}
