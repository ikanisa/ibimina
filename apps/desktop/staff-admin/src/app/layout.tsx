import type { Metadata } from "next";
import "./globals.css";
import { UpdateNotification } from "@/components/desktop";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "SACCO+ Staff Admin",
  description: "Desktop application for SACCO+ staff administration",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <UpdateNotification />
        </AuthProvider>
      </body>
    </html>
  );
}
