import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata = {
  title: "FAQ | SACCO+ Client",
  description: "Frequently asked questions",
};

const faqs = [
  {
    question: "How do I make a payment to my group?",
    answer:
      "Go to the Pay page and tap on the USSD code for your group. Your phone will dial the code automatically. Follow the prompts to complete the payment.",
  },
  {
    question: "What is my reference token?",
    answer:
      "Your reference token is a unique identifier used for payments. You can find it on your Profile page. Share it with others who need to send you money.",
  },
  {
    question: "How long does it take for payments to appear?",
    answer:
      "Payments are typically confirmed within 5-8 seconds after you complete the mobile money transaction.",
  },
  {
    question: "Can I join multiple groups?",
    answer:
      "Yes! You can join as many groups as you like. Go to the Groups page and tap 'Ask to Join' on any group you're interested in.",
  },
  {
    question: "How do I view my transaction history?",
    answer:
      "Tap on Statements in the bottom navigation to see all your transactions, including pending and confirmed payments.",
  },
  {
    question: "What if I can't find my payment?",
    answer:
      "If your payment doesn't appear after a few minutes, contact your SACCO staff. They can check the transaction manually using your reference token.",
  },
];

export default function FAQPage() {
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
            <p className="mt-4 text-neutral-600 leading-relaxed">{faq.answer}</p>
          </details>
        ))}
      </main>
    </div>
  );
}
