import { headers } from "next/headers";
import { ChatUI } from "@/components/chat/ChatUI";
import type { SupportedLocale } from "@/components/chat/types";

export const metadata = {
  title: "Chat | SACCO+ Client",
  description: "Talk to the SACCO+ AI agent",
};

const supportedLocales: SupportedLocale[] = ["rw", "en", "fr"];

export default function ChatPage() {
  const localeHeader = headers().get("x-next-intl-locale") as SupportedLocale | null;
  const initialLocale = supportedLocales.includes(localeHeader ?? "rw")
    ? (localeHeader ?? "rw")
    : "rw";

  return <ChatUI initialLocale={initialLocale} />;
}
