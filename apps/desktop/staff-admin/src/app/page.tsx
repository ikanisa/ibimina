'use client';

import { useEffect, useState } from 'react';
import { 
  isTauri, 
  getCurrentVersion, 
  getPrinters,
  isScannerAvailable,
  isNfcAvailable,
  isBiometricsAvailable,
  type PrinterInfo
} from '@/lib/tauri';

export default function Home() {
  const [version, setVersion] = useState<string>('');
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [features, setFeatures] = useState({
    scanner: false,
    nfc: false,
    biometrics: false,
  });

  useEffect(() => {
    if (!isTauri()) return;

    // Get version
    getCurrentVersion().then(setVersion).catch(console.error);

    // Check hardware features
    Promise.all([
      isScannerAvailable(),
      isNfcAvailable(),
      isBiometricsAvailable(),
    ]).then(([scanner, nfc, biometrics]) => {
      setFeatures({ scanner, nfc, biometrics });
    }).catch(console.error);

    // Get printers
    getPrinters().then(setPrinters).catch(console.error);
  }, []);

  if (!isTauri()) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">SACCO+ Staff Admin</h1>
          <p className="text-gray-600">This app must be run in Tauri desktop environment.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">SACCO+ Staff Admin</h1>
        <p className="text-gray-600 dark:text-gray-400">Version {version}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Hardware Features Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-4">Hardware Support</h2>
          <div className="space-y-2">
            <FeatureItem 
              label="Barcode Scanner" 
              available={features.scanner} 
            />
            <FeatureItem 
              label="NFC Reader" 
              available={features.nfc} 
            />
            <FeatureItem 
              label="Biometric Auth" 
              available={features.biometrics} 
            />
          </div>
        </div>

        {/* Printers Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-4">Available Printers</h2>
          {printers.length > 0 ? (
            <ul className="space-y-2">
              {printers.map((printer, index) => (
                <li 
                  key={index}
                  className="flex items-center justify-between rounded bg-gray-50 p-2 dark:bg-gray-900"
                >
                  <span className="text-sm">{printer.name}</span>
                  {printer.is_default && (
                    <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Default
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No printers found</p>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-xl font-semibold mb-4">Desktop Features</h2>
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>Secure credential storage using OS keychain</li>
          <li>Native printing with thermal receipt support (ESC/POS)</li>
          <li>Barcode scanner integration (HID)</li>
          <li>NFC reader support</li>
          <li>Biometric authentication (Windows Hello / Touch ID)</li>
          <li>Auto-update system</li>
          <li>System tray integration</li>
        </ul>
      </div>
    </main>
  );
}

function FeatureItem({ label, available }: { label: string; available: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <span className={`rounded px-2 py-1 text-xs ${
        available 
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      }`}>
        {available ? 'Available' : 'Not Available'}
      </span>
    </div>
  );
}
