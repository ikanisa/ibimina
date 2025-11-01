"use client";

import { useState } from "react";
import Link from "next/link";
import { QRLogin } from "./qr-login";
import { ArrowLeft } from "lucide-react";

export function DeviceLoginPage() {
  return (
    <div className="space-y-6">
      <QRLogin
        onSuccess={(data) => {
          console.log("Login successful:", data);
        }}
        onError={(error) => {
          console.error("Login error:", error);
        }}
      />

      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-atlas-blue hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Password Login
        </Link>
      </div>

      <div className="mt-8 rounded-lg bg-neutral-2 p-4 space-y-3">
        <h3 className="font-medium text-neutral-12 text-sm">Don't have the Staff Mobile App?</h3>
        <div className="space-y-2 text-sm text-neutral-11">
          <p>
            Download the <strong>Ibimina Staff</strong> app from Google Play Store to use
            biometric authentication.
          </p>
          <p className="text-xs">
            You'll need to enroll your device first before you can use QR login.
          </p>
        </div>
      </div>
    </div>
  );
}
