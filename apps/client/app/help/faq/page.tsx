import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { getLocale } from "next-intl/server";

import { defaultLocale, isValidLocale } from "@/i18n";
import { getClientContentPack } from "@/lib/content/pack";

export const metadata = {
  title: "FAQ | SACCO+ Client",
  description: "Frequently asked questions",
};

export default async function FAQPage() {
  const locale = await getLocale();
  const activeLocale = isValidLocale(locale) ? locale : defaultLocale;
  const contentPack = getClientContentPack(activeLocale);

  const faqs = [
    {
      question: "USSD contribution guide",
      answerItems: contentPack.help.paymentGuide,
    },
    {
      question: "Troubleshooting steps",
      answerItems: contentPack.help.troubleshooting,
    },
    {
      question: "Dual SIM and network tips",
      answerItems: [
        ...(contentPack.tips?.dualSim ?? []),
        ...(contentPack.tips?.networkIssues ?? []),
      ],
    },
    {
      question: "Market day reminders",
      answerItems: contentPack.tips?.marketDays ?? [],
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <header className="bg-white border-b border-neutral-200">
        <div className="mx-auto max-w-screen-xl px-4 py-4">
          <Link
            href="/help"
            className="inline-flex items-center gap-2 text-atlas-blue hover:text-atlas-blue-dark transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back to Help</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-neutral-900">Frequently Asked Questions</h1>
        </div>
      </header>

      <main className="mx-auto max-w-screen-xl space-y-4 px-4 py-6">
        {faqs.map((faq, index) => (
          <details
            key={index}
            className="group rounded-2xl border border-neutral-200 bg-white p-6 transition-all hover:border-atlas-blue/30"
          >
            <summary className="cursor-pointer list-none text-lg font-semibold text-neutral-900 group-hover:text-atlas-blue">
              {faq.question}
            </summary>
            <ul className="mt-4 space-y-2 text-neutral-700 leading-relaxed list-disc pl-6">
              {faq.answerItems.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          </details>
        ))}
      </main>
    </div>
  );
}
