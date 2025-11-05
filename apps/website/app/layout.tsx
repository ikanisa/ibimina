import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
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
        <Header />

        {/* Main content */}
        <main id="main-content" className="pt-16">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-neutral-50 border-t border-neutral-200 mt-24 no-print">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              {/* Brand */}
              <div className="col-span-2 md:col-span-1">
                <h3 className="font-bold text-lg text-neutral-900 mb-3">SACCO+</h3>
                <p className="text-sm text-neutral-700 leading-relaxed">
                  Digitizing ibimina for Umurenge SACCOs across Rwanda
                </p>
              </div>

              {/* For Members */}
              <div>
                <h4 className="font-semibold text-neutral-900 mb-3">For Members</h4>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/members#ussd-guide"
                      className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors"
                    >
                      USSD Guide
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/members#faq"
                      className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors"
                    >
                      Member FAQ
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/contact"
                      className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors"
                    >
                      Get Help
                    </Link>
                  </li>
                </ul>
              </div>

              {/* For SACCOs */}
              <div>
                <h4 className="font-semibold text-neutral-900 mb-3">For SACCOs</h4>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/saccos#staff-flow"
                      className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors"
                    >
                      Staff Flow
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/saccos#data-privacy"
                      className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors"
                    >
                      Data Privacy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/pilot-nyamagabe"
                      className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors"
                    >
                      Join Pilot
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="font-semibold text-neutral-900 mb-3">Legal</h4>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/legal/terms"
                      className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors"
                    >
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/legal/privacy"
                      className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/contact"
                      className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors"
                    >
                      Contact Us
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="pt-8 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-neutral-700">&copy; 2025 SACCO+. All rights reserved.</p>
              <div className="flex items-center gap-6">
                <Link
                  href="/legal/privacy"
                  className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors"
                >
                  Privacy
                </Link>
                <Link
                  href="/legal/terms"
                  className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors"
                >
                  Terms
                </Link>
                <Link
                  href="/contact"
                  className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors"
                >
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
