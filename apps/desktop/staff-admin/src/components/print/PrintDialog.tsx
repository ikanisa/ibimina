import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Printer, 
  Eye,
  Download,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import DOMPurify from 'dompurify';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

interface PrinterInfo {
  id: string;
  name: string;
  isDefault: boolean;
  status: 'ready' | 'busy' | 'offline' | 'error';
  type: 'laser' | 'inkjet' | 'thermal' | 'dot-matrix';
  capabilities: {
    color: boolean;
    duplex: boolean;
    copies: number;
    paperSizes: string[];
  };
}

interface PrintOptions {
  printerId: string;
  copies: number;
  color: boolean;
  duplex: boolean;
  paperSize: string;
  orientation: 'portrait' | 'landscape';
  scale: number;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

interface PrintDialogProps {
  open: boolean;
  onClose: () => void;
  documentType: 'receipt' | 'report' | 'statement' | 'custom';
  documentTitle: string;
  content: string | React.ReactNode;
  onPrint?: (options: PrintOptions) => Promise<void>;
}

function PrintDialogContent({
  open,
  onClose,
  documentType,
  documentTitle,
  content,
  onPrint,
}: PrintDialogProps) {
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [options, setOptions] = useState<PrintOptions>({
    printerId: '',
    copies: 1,
    color: false,
    duplex: false,
    paperSize: 'A4',
    orientation: 'portrait',
    scale: 100,
    margins: { top: 10, right: 10, bottom: 10, left: 10 },
  });

  // Fetch available printers
  useEffect(() => {
    async function loadPrinters() {
      try {
        setIsLoading(true);
        setError(null);
        const availablePrinters = await invoke<PrinterInfo[]>('get_printers');
        
        if (!availablePrinters || availablePrinters.length === 0) {
          setError('No printers found');
          return;
        }
        
        setPrinters(availablePrinters);
        
        // Select default printer
        const defaultPrinter = availablePrinters.find(p => p.isDefault);
        if (defaultPrinter) {
          setSelectedPrinter(defaultPrinter.id);
          setOptions(prev => ({ ...prev, printerId: defaultPrinter.id }));
        } else {
          // Select first printer if no default
          setSelectedPrinter(availablePrinters[0].id);
          setOptions(prev => ({ ...prev, printerId: availablePrinters[0].id }));
        }
      } catch (err) {
        setError('Failed to load printers');
        console.error('Printer loading error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (open) {
      loadPrinters();
    }
  }, [open]);

  // Get selected printer details
  const currentPrinter = printers.find(p => p.id === selectedPrinter);

  // Validate printer capabilities when selected
  useEffect(() => {
    if (currentPrinter) {
      setOptions(prev => ({
        ...prev,
        color: prev.color && currentPrinter.capabilities.color,
        duplex: prev.duplex && currentPrinter.capabilities.duplex,
        copies: Math.min(prev.copies, currentPrinter.capabilities.copies),
      }));
    }
  }, [currentPrinter]);

  // Handle print with retry logic
  const handlePrint = useCallback(async () => {
    if (!selectedPrinter) {
      setError('Please select a printer');
      return;
    }

    if (currentPrinter?.status !== 'ready') {
      setError(`Printer is ${currentPrinter?.status}. Please wait or select another printer.`);
      return;
    }

    setIsPrinting(true);
    setError(null);

    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        if (onPrint) {
          await onPrint({ ...options, printerId: selectedPrinter });
        } else {
          // Default print behavior
          await invoke('print_document', {
            printerId: selectedPrinter,
            content: typeof content === 'string' ? content : '',
            options,
          });
        }
        onClose();
        return;
      } catch (err) {
        retries++;
        const errorMessage = err instanceof Error ? err.message : 'Print failed';
        
        if (retries >= maxRetries) {
          setError(`${errorMessage} (after ${maxRetries} attempts)`);
        } else {
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries - 1)));
        }
      }
    }

    setIsPrinting(false);
  }, [selectedPrinter, options, content, onPrint, onClose, currentPrinter]);

  // Handle export to PDF
  const handleExportPDF = useCallback(async () => {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      
      const filePath = await save({
        defaultPath: `${documentTitle.replace(/\s+/g, '_')}.pdf`,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      });

      if (filePath) {
        await invoke('export_to_pdf', {
          content: typeof content === 'string' ? content : '',
          filePath,
          options,
        });
      }
    } catch (err) {
      setError('Failed to export PDF: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, [content, documentTitle, options]);

  // Sanitize HTML content
  const sanitizedContent = typeof content === 'string' 
    ? DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'table', 'tr', 'td', 'th', 'div', 'span'],
        ALLOWED_ATTR: ['class', 'style'],
      })
    : null;

  return (
    <Dialog open={open} onClose={onClose} size="xl">
      <div className="flex h-[600px]">
        {/* Preview Panel */}
        <div className="flex-1 bg-neutral-100 dark:bg-neutral-900 p-6 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary">Preview</h3>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-2 rounded-lg hover:bg-surface-overlay transition-colors"
              aria-label={showPreview ? 'Hide preview' : 'Show preview'}
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>

          {showPreview && (
            <div 
              className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-8 mx-auto"
              style={{
                width: options.orientation === 'portrait' ? '210mm' : '297mm',
                minHeight: options.orientation === 'portrait' ? '297mm' : '210mm',
                transform: `scale(${Math.min(1, 500 / (options.orientation === 'portrait' ? 210 : 297))})`,
                transformOrigin: 'top center',
              }}
            >
              {sanitizedContent ? (
                <div 
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                />
              ) : (
                content
              )}
            </div>
          )}
        </div>

        {/* Settings Panel */}
        <div className="w-80 border-l border-border-default p-6 overflow-auto">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Print Settings</h2>
              <p className="text-sm text-text-muted">{documentTitle}</p>
            </div>

            {/* Printer Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Printer</label>
              {isLoading ? (
                <div className="flex items-center gap-2 text-text-muted">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading printers...</span>
                </div>
              ) : (
                <Select
                  value={selectedPrinter}
                  onChange={(e) => {
                    setSelectedPrinter(e.target.value);
                    setOptions(prev => ({ ...prev, printerId: e.target.value }));
                  }}
                  options={printers.map(p => ({
                    value: p.id,
                    label: `${p.name}${p.isDefault ? ' (Default)' : ''}`,
                  }))}
                  aria-label="Select printer"
                />
              )}
              {currentPrinter && (
                <div className="flex items-center gap-2 text-xs" role="status">
                  <span 
                    className={`w-2 h-2 rounded-full ${
                      currentPrinter.status === 'ready' ? 'bg-green-500' :
                      currentPrinter.status === 'busy' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    aria-label={`Printer status: ${currentPrinter.status}`}
                  />
                  <span className="text-text-muted capitalize">{currentPrinter.status}</span>
                </div>
              )}
            </div>

            {/* Copies */}
            <div className="space-y-2">
              <label htmlFor="copies" className="text-sm font-medium text-text-secondary">
                Copies
              </label>
              <input
                id="copies"
                type="number"
                min={1}
                max={currentPrinter?.capabilities.copies || 99}
                value={options.copies}
                onChange={(e) => setOptions(prev => ({ 
                  ...prev, 
                  copies: Math.max(1, Math.min(currentPrinter?.capabilities.copies || 99, parseInt(e.target.value) || 1))
                }))}
                className="w-full px-3 py-2 bg-surface-overlay border border-border-default rounded-lg focus:ring-2 focus:ring-primary-500"
                aria-label="Number of copies"
              />
            </div>

            {/* Paper Size */}
            <div className="space-y-2">
              <label htmlFor="paper-size" className="text-sm font-medium text-text-secondary">
                Paper Size
              </label>
              <Select
                id="paper-size"
                value={options.paperSize}
                onChange={(e) => setOptions(prev => ({ ...prev, paperSize: e.target.value }))}
                options={[
                  { value: 'A4', label: 'A4 (210 × 297 mm)' },
                  { value: 'A5', label: 'A5 (148 × 210 mm)' },
                  { value: 'Letter', label: 'Letter (8.5 × 11 in)' },
                  { value: 'Legal', label: 'Legal (8.5 × 14 in)' },
                  { value: 'Receipt', label: 'Receipt (80mm)' },
                ]}
                aria-label="Select paper size"
              />
            </div>

            {/* Orientation */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Orientation</label>
              <div className="flex gap-2" role="radiogroup" aria-label="Page orientation">
                <button
                  onClick={() => setOptions(prev => ({ ...prev, orientation: 'portrait' }))}
                  className={`flex-1 py-2 px-3 rounded-lg border transition-colors ${
                    options.orientation === 'portrait'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                      : 'border-border-default hover:bg-surface-overlay'
                  }`}
                  role="radio"
                  aria-checked={options.orientation === 'portrait'}
                >
                  <div className="w-6 h-8 border-2 border-current mx-auto rounded" />
                  <span className="text-xs mt-1 block">Portrait</span>
                </button>
                <button
                  onClick={() => setOptions(prev => ({ ...prev, orientation: 'landscape' }))}
                  className={`flex-1 py-2 px-3 rounded-lg border transition-colors ${
                    options.orientation === 'landscape'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                      : 'border-border-default hover:bg-surface-overlay'
                  }`}
                  role="radio"
                  aria-checked={options.orientation === 'landscape'}
                >
                  <div className="w-8 h-6 border-2 border-current mx-auto rounded" />
                  <span className="text-xs mt-1 block">Landscape</span>
                </button>
              </div>
            </div>

            {/* Color/B&W Toggle */}
            {currentPrinter?.capabilities.color && (
              <div className="flex items-center justify-between">
                <label htmlFor="color-toggle" className="text-sm font-medium text-text-secondary">
                  Color
                </label>
                <Switch
                  id="color-toggle"
                  checked={options.color}
                  onChange={(checked) => setOptions(prev => ({ ...prev, color: checked }))}
                  aria-label="Print in color"
                />
              </div>
            )}

            {/* Duplex Toggle */}
            {currentPrinter?.capabilities.duplex && (
              <div className="flex items-center justify-between">
                <label htmlFor="duplex-toggle" className="text-sm font-medium text-text-secondary">
                  Double-sided
                </label>
                <Switch
                  id="duplex-toggle"
                  checked={options.duplex}
                  onChange={(checked) => setOptions(prev => ({ ...prev, duplex: checked }))}
                  aria-label="Print double-sided"
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg" role="alert">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-4 border-t border-border-default">
              <Button
                onClick={handlePrint}
                disabled={isPrinting || !selectedPrinter || currentPrinter?.status !== 'ready'}
                className="w-full"
              >
                {isPrinting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Printing...
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPDF}
                className="w-full"
                disabled={isPrinting}
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                className="w-full"
                disabled={isPrinting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

export function PrintDialog(props: PrintDialogProps) {
  return (
    <ErrorBoundary>
      <PrintDialogContent {...props} />
    </ErrorBoundary>
  );
}
