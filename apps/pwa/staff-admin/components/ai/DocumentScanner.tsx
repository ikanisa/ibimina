import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, FileText, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import { useDocumentScanner } from '@/hooks/ai/use-document-scanner';
import { formatCurrency } from '@/lib/format';

interface DocumentScannerProps {
  onScanComplete?: (data: any) => void;
  acceptedTypes?: ('receipt' | 'id_card' | 'bank_statement')[];
  className?: string;
}

export function DocumentScanner({
  onScanComplete,
  acceptedTypes = ['receipt', 'id_card', 'bank_statement'],
  className = '',
}: DocumentScannerProps) {
  const { scanDocument, isScanning, error } = useDocumentScanner();
  const [result, setResult] = useState<any | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Scan document
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    const scanResult = await scanDocument(uint8Array, file.type);
    
    if (scanResult) {
      setResult(scanResult);
      onScanComplete?.(scanResult);
    }
  }, [scanDocument, onScanComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const reset = () => {
    setResult(null);
    setPreview(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      {!result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`
            relative border-2 border-dashed rounded-xl p-8 transition-all
            ${dragActive 
              ? 'border-primary-500 bg-primary-500/10' 
              : 'border-border-default bg-surface-elevated hover:bg-surface-subtle'
            }
            ${isScanning ? 'pointer-events-none opacity-50' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isScanning}
          />

          <div className="text-center">
            {isScanning ? (
              <Loader2 className="w-12 h-12 mx-auto text-primary-500 animate-spin" />
            ) : (
              <Upload className="w-12 h-12 mx-auto text-text-muted" />
            )}
            
            <h3 className="mt-4 text-lg font-semibold text-text-primary">
              {isScanning ? 'Scanning document...' : 'Upload Document'}
            </h3>
            
            <p className="mt-2 text-sm text-text-muted">
              Drag & drop or click to select
            </p>
            
            <p className="mt-1 text-xs text-text-muted">
              Supported: {acceptedTypes.join(', ')}
            </p>
          </div>
        </motion.div>
      )}

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-3 p-4 bg-error-500/10 border border-error-500/20 rounded-lg"
          >
            <AlertCircle className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-error-600">Scan Failed</p>
              <p className="text-sm text-error-700 mt-1">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Display */}
      <AnimatePresence>
        {result && preview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-surface-elevated border border-border-default rounded-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-default">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success-500/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-success-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary capitalize">
                    {result.type.replace('_', ' ')} Detected
                  </h4>
                  <p className="text-sm text-text-muted">
                    Confidence: {Math.round(result.confidence * 100)}%
                  </p>
                </div>
              </div>
              <button
                onClick={reset}
                className="p-2 hover:bg-surface-subtle rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4">
              {/* Preview */}
              <div>
                <img
                  src={preview}
                  alt="Scanned document"
                  className="w-full rounded-lg border border-border-default"
                />
              </div>

              {/* Extracted Data */}
              <div className="space-y-4">
                <div>
                  <h5 className="text-sm font-medium text-text-muted mb-3">Extracted Data</h5>
                  <div className="space-y-2">
                    {Object.entries(result.extractedData).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-start">
                        <span className="text-sm text-text-muted capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className="text-sm font-medium text-text-primary text-right">
                          {typeof value === 'number' && key.includes('amount')
                            ? formatCurrency(value)
                            : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggestions */}
                {result.suggestions?.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-text-muted mb-2">Suggestions</h5>
                    <ul className="space-y-1">
                      {result.suggestions.map((suggestion: string, i: number) => (
                        <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                          <span className="text-info-500">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {result.warnings?.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-warning-600 mb-2">Warnings</h5>
                    <ul className="space-y-1">
                      {result.warnings.map((warning: string, i: number) => (
                        <li key={i} className="text-sm text-warning-700 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 p-4 border-t border-border-default bg-surface-subtle">
              <button
                onClick={() => onScanComplete?.(result)}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
              >
                Use This Data
              </button>
              <button
                onClick={reset}
                className="px-4 py-2 border border-border-default rounded-lg hover:bg-surface-subtle transition-colors"
              >
                Scan Another
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
