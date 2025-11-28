import type { Metadata } from "next";
import "./globals.css";
import { UpdateNotification } from "@/components/desktop";
import { AuthProvider } from "@/lib/auth";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";

export const metadata: Metadata = {
  title: "SACCO+ Staff Admin",
  description: "Desktop application for SACCO+ staff administration",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AccessibilityProvider>
          <AuthProvider>
            {children}
            <UpdateNotification />
          </AuthProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
