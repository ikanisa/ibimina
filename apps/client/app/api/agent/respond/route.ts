import { NextRequest } from "next/server";
import type { SupportedLocale } from "@/components/chat/types";

interface Scenario {
  text: Record<SupportedLocale, string>;
  allocation?: {
    heading: Record<SupportedLocale, string>;
    subheading: Record<SupportedLocale, string>;
  };
  ticket?: {
    heading: Record<SupportedLocale, string>;
    status: Record<SupportedLocale, string>;
    summary: Record<SupportedLocale, string>;
  };
}

const scenarios: Record<string, Scenario> = {
  ussd: {
    text: {
      rw: "Dukurikire izi ntambwe kuri *182*8*1#:1) Hitamo itsinda ryawe 2) Andika kode ya SACCO+ 3) Emeza amafaranga. Nyuma yo kwishyura uzabona ubutumwa bwa SACCO+.",
      en: "Follow these steps on *182*8*1#: 1) Select your group 2) Enter the SACCO+ code 3) Confirm the amount. You will receive a SACCO+ confirmation once paid.",
      fr: "Suivez ces étapes sur *182*8*1# : 1) Choisissez votre groupe 2) Entrez le code SACCO+ 3) Confirmez le montant. Vous recevrez une confirmation SACCO+ après le paiement.",
    },
  },
  reference: {
    text: {
      rw: "Indangamuryango yawe ni 2501-884. Uyikoresha kuri USSD cyangwa banki kugira ngo amafaranga agaruke mu itsinda ryawe. Sangiza iyi kode gusa ku muntu wizeye.",
      en: "Your reference token is 2501-884. Share it when paying via USSD or bank so that allocations land in your group. Keep it private to protect your account.",
      fr: "Votre identifiant de référence est 2501-884. Partagez-le lors d’un paiement USSD ou bancaire afin que l’allocation arrive dans votre groupe. Gardez-le privé pour sécuriser votre compte.",
    },
  },
  statements: {
    text: {
      rw: "Nabonye ibishyurwa biheruka mu mibare yo gushyikiriza itsinda ryawe. Hasi aha harimo imbonerahamwe yemeza ibyoherejwe byakiriwe ku gihe.",
      en: "Here is a summary of the recent allocations linked to your reference token. I’ve included the confirmed transactions below.",
      fr: "Voici un résumé des allocations récentes liées à votre identifiant de référence. Les transactions confirmées sont listées ci-dessous.",
    },
    allocation: {
      heading: {
        rw: "Imbonerahamwe y’inyandiko",
        en: "Allocation summary",
        fr: "Synthèse des allocations",
      },
      subheading: {
        rw: "Iyi ni raporo y’ibikorwa biheruka ku itsinda ryawe.",
        en: "This report shows the latest confirmed activity for your group.",
        fr: "Ce rapport présente les dernières opérations confirmées de votre groupe.",
      },
    },
  },
  ticket: {
    text: {
      rw: "Nafunguye itike nshya kugira ngo tugufashe ku mwishyurire wananiranye. Umukozi wa SACCO azakugeraho mu gihe gito.",
      en: "I opened a new ticket so the SACCO team can review your failed contribution. A staff member will follow up shortly.",
      fr: "J’ai créé un nouveau ticket pour que l’équipe SACCO examine votre contribution échouée. Un agent vous contactera bientôt.",
    },
    ticket: {
      heading: {
        rw: "Itike yemejwe",
        en: "Ticket confirmed",
        fr: "Ticket confirmé",
      },
      status: {
        rw: "Irategereje isuzumwa",
        en: "Awaiting review",
        fr: "En attente d’examen",
      },
      summary: {
        rw: "Twakiriye ikibazo cy’umusanzu wananiranye ku itariki wavuze.",
        en: "We logged the failed contribution you reported and will investigate.",
        fr: "Nous avons enregistré la contribution échouée signalée et allons enquêter.",
      },
    },
  },
  default: {
    text: {
      rw: "Muraho! Ndi umufasha wa SACCO+. Shobora kugufasha kubona intambwe za USSD, indangamuryango cyangwa raporo z’itsinda.",
      en: "Hello! I’m the SACCO+ assistant. Ask about USSD steps, your reference token, or request statement summaries.",
      fr: "Bonjour ! Je suis l’assistant SACCO+. Demandez les étapes USSD, votre identifiant de référence ou un résumé des relevés.",
    },
  },
};

function detectScenario(message: string, quickAction?: string) {
  if (quickAction && scenarios[quickAction]) return scenarios[quickAction];
  const normalised = message.toLowerCase();
  if (normalised.includes("ticket")) return scenarios.ticket;
  if (normalised.includes("statement") || normalised.includes("allocation"))
    return scenarios.statements;
  if (normalised.includes("ussd")) return scenarios.ussd;
  if (normalised.includes("reference")) return scenarios.reference;
  return scenarios.default;
}

const encoder = new TextEncoder();

function writeEvent(controller: ReadableStreamDefaultController, event: string, data: unknown) {
  controller.enqueue(encoder.encode(`event: ${event}\n`));
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const { message, locale = "rw", quickAction } = await request.json();
  const language = (locale ?? "rw") as SupportedLocale;
  const scenario = detectScenario(String(message ?? ""), quickAction);

  const stream = new ReadableStream({
    async start(controller) {
      const messageId = `assistant-${Date.now()}`;
      const abort = () => {
        try {
          controller.close();
        } catch (error) {
          console.warn("SSE controller already closed", error);
        }
      };
      request.signal.addEventListener("abort", abort);

      writeEvent(controller, "message", { type: "message-start", messageId });

      const text = scenario.text[language] ?? scenario.text.rw;
      const parts = text.split(/(\s+)/);
      for (const part of parts) {
        if (!part) continue;
        writeEvent(controller, "message", { type: "message-delta", messageId, delta: part });
        await sleep(60);
      }

      writeEvent(controller, "message", { type: "message-end", messageId });

      if (scenario.allocation) {
        writeEvent(controller, "message", {
          type: "allocation",
          messageId,
          payload: {
            heading: scenario.allocation.heading,
            subheading: scenario.allocation.subheading,
            allocations: [
              {
                id: "alloc-1",
                groupName: "Kigali Business Group",
                amount: 45000,
                reference: "2501-884",
                status: "CONFIRMED",
                allocatedAt: new Date().toISOString(),
              },
              {
                id: "alloc-2",
                groupName: "Nyamata Farmers",
                amount: 27500,
                reference: "2501-884",
                status: "CONFIRMED",
                allocatedAt: new Date(Date.now() - 86400000).toISOString(),
              },
            ],
          },
        });
      }

      if (scenario.ticket) {
        writeEvent(controller, "message", {
          type: "ticket",
          messageId,
          payload: {
            heading: scenario.ticket.heading,
            status: scenario.ticket.status,
            summary: scenario.ticket.summary,
            reference: `SUP-${Date.now().toString().slice(-6)}`,
            submittedAt: new Date().toISOString(),
          },
        });
      }

      controller.close();
      request.signal.removeEventListener("abort", abort);
    },
    cancel() {
      // stream closed early by the client
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export const runtime = "edge";
export const dynamic = "force-dynamic";
