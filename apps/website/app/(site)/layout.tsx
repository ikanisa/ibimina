import "@/app/globals.css";
import type { Metadata } from "next";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";

export const metadata: Metadata = {
  title: "SACCO+ — Digitizing Ibimina & Umurenge SACCOs",
  description:
    "Standalone intermediation: USSD deposits to SACCO MoMo accounts, standardized references, and clean allocation reports for Umurenge SACCOs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-rwanda text-white">
        <div className="min-h-screen bg-black/20">
          <Navbar />
          <main className="container mx-auto px-4 py-8">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
