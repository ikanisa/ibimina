/**
 * Type-safe TypeScript bindings for Tauri Rust commands
 */

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// ============================================================================
// Auth Types & Commands
// ============================================================================

export interface SecureCredentials {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export async function getSecureCredentials(): Promise<SecureCredentials | null> {
  return invoke<SecureCredentials | null>('get_secure_credentials');
}

export async function setSecureCredentials(credentials: SecureCredentials): Promise<void> {
  return invoke('set_secure_credentials', { credentials });
}

export async function deleteSecureCredentials(): Promise<void> {
  return invoke('delete_secure_credentials');
}

export async function getDeviceId(): Promise<string> {
  return invoke<string>('get_device_id');
}

// ============================================================================
// Print Types & Commands
// ============================================================================

export interface PrinterInfo {
  name: string;
  is_default: boolean;
  status: string;
}

export interface ReceiptItem {
  label: string;
  value: string;
}

export interface ReceiptData {
  title: string;
  items: ReceiptItem[];
  total: string;
  footer: string;
}

export async function getPrinters(): Promise<PrinterInfo[]> {
  return invoke<PrinterInfo[]>('get_printers');
}

export async function printHtml(printerName: string, htmlContent: string): Promise<void> {
  return invoke('print_html', { 
    printerName, 
    htmlContent 
  });
}

export async function printReceipt(printerName: string, receiptData: ReceiptData): Promise<void> {
  return invoke('print_receipt', { 
    printerName, 
    receiptData 
  });
}

// ============================================================================
// Hardware Types & Commands
// ============================================================================

export interface ScanResult {
  data: string;
  scan_type: string;
  timestamp: number;
}

export interface NFCData {
  uid: string;
  type: string;
  data: string;
}

export async function isScannerAvailable(): Promise<boolean> {
  return invoke<boolean>('is_scanner_available');
}

export async function startBarcodeScan(): Promise<void> {
  return invoke('start_barcode_scan');
}

export async function stopBarcodeScan(): Promise<void> {
  return invoke('stop_barcode_scan');
}

export async function isNfcAvailable(): Promise<boolean> {
  return invoke<boolean>('is_nfc_available');
}

export async function startNfcReading(): Promise<void> {
  return invoke('start_nfc_reading');
}

export async function stopNfcReading(): Promise<void> {
  return invoke('stop_nfc_reading');
}

export async function isBiometricsAvailable(): Promise<boolean> {
  return invoke<boolean>('is_biometrics_available');
}

export async function authenticateBiometrics(reason: string): Promise<boolean> {
  return invoke<boolean>('authenticate_biometrics', { reason });
}

// ============================================================================
// Update Types & Commands
// ============================================================================

export interface UpdateInfo {
  current_version: string;
  latest_version: string;
  update_available: boolean;
  release_notes: string;
  download_url: string;
}

export interface DownloadProgress {
  downloaded: number;
  total: number;
  percentage: number;
}

export async function checkForUpdates(): Promise<UpdateInfo> {
  return invoke<UpdateInfo>('check_for_updates');
}

export async function downloadUpdate(downloadUrl: string): Promise<string> {
  return invoke<string>('download_update', { downloadUrl });
}

export async function installUpdate(installerPath: string): Promise<void> {
  return invoke('install_update', { installerPath });
}

export async function getCurrentVersion(): Promise<string> {
  return invoke<string>('get_current_version');
}

// ============================================================================
// Event Listeners
// ============================================================================

export type BarcodeScanHandler = (event: ScanResult) => void;
export type NFCDetectedHandler = (event: NFCData) => void;
export type DownloadProgressHandler = (event: DownloadProgress) => void;
export type UpdateAvailableHandler = (event: UpdateInfo) => void;

export async function onBarcodeScanned(handler: BarcodeScanHandler) {
  return listen<ScanResult>('barcode-scanned', (event) => {
    handler(event.payload);
  });
}

export async function onNfcDetected(handler: NFCDetectedHandler) {
  return listen<NFCData>('nfc-detected', (event) => {
    handler(event.payload);
  });
}

export async function onDownloadProgress(handler: DownloadProgressHandler) {
  return listen<DownloadProgress>('download-progress', (event) => {
    handler(event.payload);
  });
}

export async function onUpdateAvailable(handler: UpdateAvailableHandler) {
  return listen<UpdateInfo>('update-available', (event) => {
    handler(event.payload);
  });
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Check if running in Tauri (desktop) environment
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Get platform information
 */
export async function getPlatform(): Promise<'windows' | 'macos' | 'linux' | 'unknown'> {
  if (!isTauri()) return 'unknown';
  
  const { platform } = await import('@tauri-apps/plugin-os');
  const platformType = await platform();
  
  if (platformType === 'windows') return 'windows';
  if (platformType === 'macos') return 'macos';
  if (platformType === 'linux') return 'linux';
  return 'unknown';
}
