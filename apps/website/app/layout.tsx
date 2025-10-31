import type { Metadata } from "next";
import Link from "next/link";
import { Globe } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SACCO+ | Digital Ibimina for Rwanda",
    template: "%s | SACCO+",
  },
  description:
    "SACCO+ digitizes ibimina savings groups for Umurenge SACCOs in Rwanda. USSD-first, intermediation-only platform with no funds handling.",
  keywords: [
    "ibimina",
    "Umurenge SACCO",
    "USSD deposits",
    "Rwanda savings",
    "mobile money",
    "village banking",
  ],
  authors: [{ name: "SACCO+" }],
  creator: "SACCO+",
  publisher: "SACCO+",
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "rw_RW",
    url: "https://saccoplus.rw",
    title: "SACCO+ | Digital Ibimina for Rwanda",
    description: "Digitize ibimina savings groups with USSD-first approach",
    siteName: "SACCO+",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="rw">
      <body className="antialiased">
        {/* Navigation */}
        <nav className="glass fixed top-4 left-4 right-4 z-50 no-print">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold">
              SACCO+
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="hover:text-rwyellow transition-colors">
                Home
              </Link>
              <Link href="/members" className="hover:text-rwyellow transition-colors">
                For Members
              </Link>
              <Link href="/saccos" className="hover:text-rwyellow transition-colors">
                For SACCOs
              </Link>
              <Link href="/pilot-nyamagabe" className="hover:text-rwyellow transition-colors">
                Pilot
              </Link>
              <Link href="/faq" className="hover:text-rwyellow transition-colors">
                FAQ
              </Link>
              <Link href="/contact" className="hover:text-rwyellow transition-colors">
                Contact
              </Link>
            </div>
            <div className="flex items-center gap-3">
              {/* Language toggle placeholder */}
              <button
                aria-label="Change language"
                className="flex items-center gap-2 glass px-3 py-2 text-sm"
              >
                <Globe size={16} />
                <span>RW</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="pt-24">{children}</main>

        {/* Footer */}
        <footer className="glass mt-16 py-8 no-print">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h3 className="font-bold text-lg mb-3">SACCO+</h3>
                <p className="text-sm opacity-90">
                  Digitizing ibimina for Umurenge SACCOs across Rwanda
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-3">For Members</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/members#ussd-guide" className="hover:text-rwyellow">
                      USSD Guide
                    </Link>
                  </li>
                  <li>
                    <Link href="/members#faq" className="hover:text-rwyellow">
                      Member FAQ
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="hover:text-rwyellow">
                      Get Help
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-3">For SACCOs</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/saccos#staff-flow" className="hover:text-rwyellow">
                      Staff Flow
                    </Link>
                  </li>
                  <li>
                    <Link href="/saccos#data-privacy" className="hover:text-rwyellow">
                      Data Privacy
                    </Link>
                  </li>
                  <li>
                    <Link href="/pilot-nyamagabe" className="hover:text-rwyellow">
                      Join Pilot
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-3">Legal</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/legal/terms" className="hover:text-rwyellow">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link href="/legal/privacy" className="hover:text-rwyellow">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="hover:text-rwyellow">
                      Contact Us
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm opacity-80">
              <p>&copy; 2025 SACCO+. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
