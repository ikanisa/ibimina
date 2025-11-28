/**
 * Document Scanner Component
 * Upload, scan, and process documents with AI
 */

import { useState, useCallback } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';
import { documentIntelligence, isFeatureEnabled, type DocumentAnalysisResult } from '@/lib/ai';
import { Upload, Camera, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';

interface DocumentScannerProps {
  onScanComplete?: (result: DocumentAnalysisResult) => void;
  onClose?: () => void;
}

export function DocumentScanner({ onScanComplete, onClose }: DocumentScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<DocumentAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Check if feature is enabled
  if (!isFeatureEnabled('documentScanning')) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600">Document scanning is not enabled</p>
      </div>
    );
  }

  const handleFileSelect = async (file: File) => {
    setIsScanning(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate progress
      setProgress(20);

      // Read file
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      setProgress(40);

      // Scan document
      const scanResult = await documentIntelligence.analyzeDocument(
        uint8Array,
        file.type,
        file.name
      );

      setProgress(100);
      setResult(scanResult);
      onScanComplete?.(scanResult);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan document');
    } finally {
      setIsScanning(false);
    }
  };

  const handleClick = async () => {
    const selected = await open({
      multiple: false,
      filters: [{
        name: 'Documents',
        extensions: ['png', 'jpg', 'jpeg', 'webp', 'pdf']
      }]
    });

    if (!selected) return;

    const filePath = selected as string;
    const fileData = await readFile(filePath);
    const fileName = filePath.split('/').pop() || 'document';
    const mimeType = getMimeType(fileName);

    // Create File object for processing
    const blob = new Blob([fileData], { type: mimeType });
    const file = new File([blob], fileName, { type: mimeType });

    handleFileSelect(file);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  if (result) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Scan Complete
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {result.type.replace('_', ' ').toUpperCase()} detected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="p-6 space-y-4">
          {/* Confidence */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Confidence
            </span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-32 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${result.confidence * 100}%` }}
                />
              </div>
              <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                {Math.round(result.confidence * 100)}%
              </span>
            </div>
          </div>

          {/* Extracted Data */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Extracted Data
            </h4>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
              {Object.entries(result.extractedData).map(([key, value]) => (
                <div key={key} className="flex items-start gap-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-32">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <span className="text-sm font-mono text-gray-900 dark:text-white">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                    Warnings
                  </p>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    {result.warnings.map((warning, i) => (
                      <li key={i}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Suggestions
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {result.suggestions.map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-500">→</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setResult(null)}
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Scan Another
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-2xl w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Scan Document
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Upload receipt, ID, or statement
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Upload Area */}
      <div className="p-6">
        <div
          className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-200 ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : isScanning
              ? 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
              : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 cursor-pointer'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={!isScanning ? handleClick : undefined}
        >
          {isScanning ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto">
                <svg className="animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  Scanning document...
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Please wait while AI analyzes your document
                </p>
              </div>
              <div className="max-w-xs mx-auto">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex justify-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {dragActive ? 'Drop to scan' : 'Click or drag to scan'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Supports PNG, JPG, WebP, PDF (max 5MB)
                </p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-900 dark:text-red-200">
                  Scan Failed
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    pdf: 'application/pdf',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}
