"use client";

import { format } from "date-fns";
import { CheckCircle2, FileText, MessageSquareSparkles } from "lucide-react";
import {
  AllocationPayload,
  ChatMessage,
  SupportedLocale,
  TicketPayload,
  ToolResultPayload,
} from "./types";
import { fmtCurrency } from "@/utils/format";

const columnLabels = {
  group: { rw: "Itsinda", en: "Group", fr: "Groupe" },
  amount: { rw: "Umubare", en: "Amount", fr: "Montant" },
  reference: { rw: "Indangamuntu", en: "Reference", fr: "Référence" },
  status: { rw: "Imiterere", en: "Status", fr: "Statut" },
  ticket: { rw: "Itike", en: "Ticket", fr: "Ticket" },
  submitted: { rw: "Yoherejwe", en: "Submitted", fr: "Envoyé" },
  summary: { rw: "Ibisobanuro", en: "Summary", fr: "Résumé" },
  tool: { rw: "Igikoresho", en: "Tool", fr: "Outil" },
  output: { rw: "Ibisohoka", en: "Output", fr: "Résultat" },
};

function bilingual(locale: SupportedLocale, copy: { rw: string; en: string; fr: string }) {
  const primary = copy[locale];
  const secondary = locale === "en" ? copy.rw : copy.en;
  if (primary === secondary) return primary;
  return `${primary} · ${secondary}`;
}

function renderAllocation(locale: SupportedLocale, payload: AllocationPayload) {
  const secondaryLabel = locale === "en" ? payload.heading.rw : payload.heading.en;
  return (
    <div className="mt-4 w-full rounded-2xl border border-atlas-blue/20 bg-atlas-glow/40 p-4">
      <header className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-atlas-blue text-white">
          <FileText className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900">{payload.heading[locale]}</p>
          <p className="text-xs font-medium text-neutral-700">{secondaryLabel}</p>
        </div>
      </header>
      <p className="mb-4 text-sm text-neutral-700">{bilingual(locale, payload.subheading)}</p>
      <div className="overflow-hidden rounded-xl border border-neutral-200">
        <div className="hidden bg-neutral-50 text-xs font-semibold text-neutral-700 sm:grid sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="px-4 py-3">{bilingual(locale, columnLabels.group)}</div>
          <div className="px-4 py-3">{bilingual(locale, columnLabels.amount)}</div>
          <div className="px-4 py-3">{bilingual(locale, columnLabels.reference)}</div>
          <div className="px-4 py-3">{bilingual(locale, columnLabels.status)}</div>
        </div>
        <div className="divide-y divide-neutral-200">
          {payload.allocations.map((allocation) => (
            <div
              key={allocation.id}
              className="grid grid-cols-1 gap-3 px-4 py-3 text-sm sm:grid-cols-[1.5fr_1fr_1fr_1fr]"
            >
              <div>
                <p className="font-semibold text-neutral-900">{allocation.groupName}</p>
                <p className="text-xs text-neutral-700">
                  {format(new Date(allocation.allocatedAt), "dd MMM yyyy")}
                </p>
              </div>
              <div className="flex flex-col justify-center text-neutral-900">
                <span className="font-semibold">{fmtCurrency(allocation.amount)}</span>
              </div>
              <div className="flex flex-col justify-center text-neutral-700">
                <span className="font-medium">{allocation.reference}</span>
              </div>
              <div className="flex flex-col justify-center">
                <span
                  className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                    allocation.status === "CONFIRMED"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {allocation.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderTicket(locale: SupportedLocale, payload: TicketPayload) {
  const secondaryLabel = locale === "en" ? payload.heading.rw : payload.heading.en;
  return (
    <div className="mt-4 w-full rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
      <header className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
          <MessageSquareSparkles className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900">{payload.heading[locale]}</p>
          <p className="text-xs font-medium text-neutral-700">{secondaryLabel}</p>
        </div>
      </header>
      <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium text-neutral-700">{bilingual(locale, columnLabels.ticket)}</dt>
          <dd className="mt-1 font-semibold text-neutral-900">{payload.reference}</dd>
        </div>
        <div>
          <dt className="font-medium text-neutral-700">{bilingual(locale, columnLabels.status)}</dt>
          <dd className="mt-1 font-semibold text-emerald-700">
            {bilingual(locale, payload.status)}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-neutral-700">
            {bilingual(locale, columnLabels.submitted)}
          </dt>
          <dd className="mt-1 text-neutral-900">
            {format(new Date(payload.submittedAt), "dd MMM yyyy HH:mm")}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-neutral-700">
            {bilingual(locale, columnLabels.summary)}
          </dt>
          <dd className="mt-1 text-neutral-700">{bilingual(locale, payload.summary)}</dd>
        </div>
      </dl>
    </div>
  );
}

function renderToolResult(locale: SupportedLocale, payload: ToolResultPayload) {
  const statusCopy =
    payload.status === "success"
      ? { rw: "Byagenze neza", en: "Success", fr: "Réussi" }
      : { rw: "Byanze", en: "Error", fr: "Erreur" };

  return (
    <div className="mt-4 w-full rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
          <span>{bilingual(locale, columnLabels.tool)}</span>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
            {payload.name}
          </span>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            payload.status === "success"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          {bilingual(locale, statusCopy)}
        </span>
      </header>
      <div className="rounded-xl bg-neutral-900/90 p-4 text-xs leading-5 text-neutral-100">
        <span className="mb-2 block font-semibold text-neutral-300">
          {bilingual(locale, columnLabels.output)}
        </span>
        <pre className="whitespace-pre-wrap break-words font-mono text-[12px] text-neutral-100">
          {typeof payload.data === "string" ? payload.data : JSON.stringify(payload.data, null, 2)}
        </pre>
      </div>
    </div>
  );
}

interface MessageProps {
  message: ChatMessage;
  locale: SupportedLocale;
}

export function Message({ message, locale }: MessageProps) {
  const isAssistant = message.role === "assistant";
  return (
    <article
      className={`flex gap-3 ${isAssistant ? "flex-row" : "flex-row-reverse"}`}
      aria-live={
        message.contents.some((content) => content.type === "text" && content.streaming)
          ? "polite"
          : undefined
      }
    >
      <div className="flex-shrink-0">
        {isAssistant ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-atlas-blue to-atlas-blue-dark">
            <MessageSquareSparkles className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-xs font-semibold text-white">
            You
          </div>
        )}
      </div>
      <div
        className={`flex max-w-2xl flex-1 flex-col ${isAssistant ? "items-start" : "items-end"}`}
      >
        {message.contents.map((content, index) => {
          if (content.type === "text") {
            return (
              <div
                key={`text-${index}`}
                className={`mb-2 rounded-2xl px-4 py-3 text-[15px] leading-6 ${
                  isAssistant ? "bg-neutral-100 text-neutral-900" : "bg-atlas-blue text-white"
                }`}
              >
                <span>{content.text}</span>
                {content.streaming ? (
                  <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-current align-middle" />
                ) : null}
              </div>
            );
          }

          if (content.type === "allocation") {
            return (
              <div key={`allocation-${index}`} className="w-full">
                {renderAllocation(locale, content.payload)}
              </div>
            );
          }

          if (content.type === "ticket") {
            return (
              <div key={`ticket-${index}`} className="w-full">
                {renderTicket(locale, content.payload)}
              </div>
            );
          }

          if (content.type === "tool-result") {
            return (
              <div key={`tool-${index}`} className="w-full">
                {renderToolResult(locale, content.payload)}
              </div>
            );
          }

          return null;
        })}
        <time className="mt-1 text-xs font-medium text-neutral-700">
          {format(message.createdAt, "HH:mm")}
        </time>
      </div>
    </article>
  );
}
