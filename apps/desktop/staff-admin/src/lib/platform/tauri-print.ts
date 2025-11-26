import type {
  PrintAdapter,
  PrintOptions,
  ReceiptData,
  PrinterInfo,
} from '@ibimina/admin-core/adapters';
import { invoke } from '@tauri-apps/api/core';

export class TauriPrint implements PrintAdapter {
  isSupported(): boolean {
    return true; // Desktop always supports printing
  }

  async printHtml(html: string, _options?: PrintOptions): Promise<void> {
    // For HTML printing, we can use the browser's print API
    // or invoke a custom Tauri command for native printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Failed to open print window');
    }

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  }

  async printReceipt(data: ReceiptData): Promise<void> {
    try {
      await invoke('print_receipt', { data });
    } catch (error) {
      console.error('Failed to print receipt:', error);
      throw error;
    }
  }

  async getPrinters(): Promise<PrinterInfo[]> {
    try {
      return await invoke<PrinterInfo[]>('get_printers');
    } catch (error) {
      console.error('Failed to get printers:', error);
      return [];
    }
  }

  async setDefaultPrinter(_printerId: string): Promise<void> {
    // This would need to be implemented as a Tauri command
    console.warn('Setting default printer not yet implemented');
  }
}
