"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, X, CheckCircle, XCircle, Loader2, AlertCircle, Shield } from "lucide-react";
import { DeviceAuth } from "@/lib/native/device-auth";
import { logInfo, logError } from "@/lib/observability/logger";
import { useToast } from "@/providers/toast-provider";
import { Html5Qrcode } from "html5-qrcode";

interface ChallengeData {
  ver: number;
  session_id: string;
  origin: string;
  nonce: string;
  exp: number;
  aud: string;
}

interface ScanResult {
  success: boolean;
  decodedText: string;
  challenge?: ChallengeData;
}

export function QrScannerPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>("");
  const [cameraId, setCameraId] = useState<string>("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    checkBiometricAndDevice();
    return () => {
      stopScanning();
    };
  }, []);

  const checkBiometricAndDevice = async () => {
    try {
      const bioStatus = await DeviceAuth.checkBiometricAvailable();
      if (!bioStatus.available) {
        setError("Biometric authentication is not available on this device");
        return;
      }

      const keyStatus = await DeviceAuth.hasDeviceKey();
      if (!keyStatus.hasKey) {
        setError("Device not enrolled. Please enroll this device first in your profile settings.");
        return;
      }

      const info = await DeviceAuth.getDeviceInfo();
      setDeviceInfo(info);
    } catch (err) {
      logError("device_check_failed", { error: err });
      setError("Failed to check device authentication status");
    }
  };

  const startScanning = async () => {
    try {
      setError("");
      setIsScanning(true);
      setIsProcessing(false);
      setScanResult(null);

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      const cameras = await Html5Qrcode.getCameras();
      if (cameras.length === 0) {
        throw new Error("No cameras found");
      }

      // Prefer back camera
      const backCamera = cameras.find((cam) => cam.label.toLowerCase().includes("back"));
      const selectedCamera = backCamera || cameras[0];
      setCameraId(selectedCamera.id);

      await scanner.start(
        selectedCamera.id,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Ignore scan errors (user is still scanning)
        }
      );

      setHasPermission(true);
    } catch (err) {
      logError("camera_start_failed", { error: err });
      setError(err instanceof Error ? err.message : "Failed to start camera");
      setIsScanning(false);
      setHasPermission(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleScanSuccess = async (decodedText: string) => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      await stopScanning();

      logInfo("qr_scanned", { text: decodedText });

      // Parse QR code challenge
      const challenge: ChallengeData = JSON.parse(decodedText);

      // Validate challenge structure
      if (!challenge.session_id || !challenge.nonce || !challenge.origin) {
        throw new Error("Invalid QR code format");
      }

      // Validate challenge with native plugin
      const validation = await DeviceAuth.validateChallenge(decodedText);
      if (!validation.valid) {
        throw new Error(validation.reason || "Challenge validation failed");
      }

      if (validation.expired) {
        throw new Error("QR code has expired. Please refresh the page and try again.");
      }

      setScanResult({
        success: true,
        decodedText,
        challenge,
      });

      // Sign challenge with biometric
      await signChallengeWithBiometric(decodedText, challenge);
    } catch (err) {
      logError("qr_scan_error", { error: err });
      const errorMessage = err instanceof Error ? err.message : "Failed to process QR code";
      setError(errorMessage);
      showError(errorMessage);
      setScanResult({
        success: false,
        decodedText,
      });
      setIsProcessing(false);
    }
  };

  const signChallengeWithBiometric = async (challengeJson: string, challenge: ChallengeData) => {
    try {
      // Get user ID from device info or challenge
      const userId = deviceInfo?.deviceId || "unknown";

      // Sign challenge (this will trigger biometric prompt)
      const signingResult = await DeviceAuth.signChallenge(challengeJson, userId, challenge.origin);

      if (!signingResult.success) {
        throw new Error("Failed to sign challenge");
      }

      logInfo("challenge_signed", {
        sessionId: signingResult.challengeInfo.sessionId,
        deviceId: signingResult.deviceId,
      });

      // Send signature to backend for verification
      await verifySignature(signingResult);
    } catch (err) {
      logError("biometric_sign_failed", { error: err });
      throw err;
    }
  };

  const verifySignature = async (signingResult: any) => {
    try {
      const response = await fetch("/api/device-auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: signingResult.challengeInfo.sessionId,
          signature: signingResult.signature,
          signed_message: signingResult.signedMessage,
          device_id: signingResult.deviceId,
          challenge_info: signingResult.challengeInfo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Verification failed");
      }

      const data = await response.json();

      if (data.success) {
        success("Authentication successful! You can now use the web dashboard.");
        logInfo("web_login_success", { sessionId: signingResult.challengeInfo.sessionId });

        // Wait a moment then navigate back
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        throw new Error(data.message || "Verification failed");
      }
    } catch (err) {
      logError("verification_failed", { error: err });
      throw err;
    }
  };

  const handleRetry = () => {
    setError("");
    setScanResult(null);
    setIsProcessing(false);
    startScanning();
  };

  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <div className="rounded-full bg-red-100 p-3">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-neutral-12">Camera Permission Required</h3>
          <p className="text-sm text-neutral-11">
            Please grant camera permission to scan QR codes for web login.
          </p>
        </div>
        <button
          onClick={startScanning}
          className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500/90 transition-colors"
        >
          Request Permission
        </button>
      </div>
    );
  }

  if (error && !isScanning) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <div className="rounded-full bg-red-100 p-3">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-neutral-12">Error</h3>
          <p className="text-sm text-red-600">{error}</p>
        </div>
        <button
          onClick={handleRetry}
          className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (scanResult && scanResult.success && isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <div className="rounded-full bg-green-100 p-3">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-neutral-12">QR Code Scanned Successfully!</h3>
          <p className="text-sm text-neutral-11">Authenticating with biometric...</p>
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 p-4">
      <div className="flex items-center gap-2 text-primary-500">
        <Camera className="h-6 w-6" />
        <h2 className="text-lg font-semibold">Scan QR Code</h2>
      </div>

      {!isScanning && !scanResult && (
        <div className="space-y-4 text-center">
          <p className="text-sm text-neutral-11">
            Position the QR code from your computer screen within the frame below. Make sure the
            code is well-lit and in focus.
          </p>
          <button
            onClick={startScanning}
            className="flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-3 text-sm font-medium text-white hover:bg-primary-500/90 transition-colors"
          >
            <Camera className="h-5 w-5" />
            Start Camera
          </button>
        </div>
      )}

      {isScanning && (
        <div className="relative w-full max-w-md">
          <div
            id="qr-reader"
            className="rounded-2xl overflow-hidden border-4 border-primary-500/20"
          />

          <button
            onClick={stopScanning}
            className="absolute top-4 right-4 rounded-full bg-red-500 p-2 text-white hover:bg-red-600 transition-colors"
            aria-label="Stop scanning"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mt-4 text-center">
            <p className="text-sm text-neutral-11">
              {isProcessing ? "Processing..." : "Scanning for QR code..."}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-lg bg-neutral-3 p-4 space-y-2 max-w-md w-full">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-medium text-neutral-12">Secure Authentication</p>
            <ul className="space-y-1 text-neutral-11 list-disc list-inside">
              <li>Biometric confirmation required</li>
              <li>QR codes expire after 2 minutes</li>
              <li>One-time use only</li>
              <li>Phishing-resistant</li>
            </ul>
          </div>
        </div>
      </div>

      {error && isScanning && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 max-w-md w-full">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
