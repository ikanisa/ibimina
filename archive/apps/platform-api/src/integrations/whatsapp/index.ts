export enum FeatureFlag {
  WHATSAPP_BETA = "whatsapp_beta",
}

export interface FeatureFlagService {
  isEnabled(flag: FeatureFlag, context?: Record<string, unknown>): boolean | Promise<boolean>;
}

export interface WhatsAppTransport {
  sendAutomatedReply(input: WhatsAppReplyInput): Promise<void>;
  markAsRead(messageId: string): Promise<void>;
}

export interface WhatsAppReplyInput {
  to: string;
  body: string;
  context?: {
    messageId?: string;
  };
}

export interface WhatsAppHandlerOptions {
  featureFlags: FeatureFlagService;
  transport: WhatsAppTransport;
  logger?: Pick<typeof console, "info" | "warn" | "error" | "debug">;
  autoReplyText?: string;
}

export type WhatsAppWebhookPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<WhatsAppWebhookMessage>;
        statuses?: Array<WhatsAppWebhookStatus>;
      };
    }>;
  }>;
};

type WhatsAppWebhookMessage = {
  id?: string;
  from?: string;
  type?: string;
  text?: {
    body?: string;
  };
};

type WhatsAppWebhookStatus = {
  id?: string;
  status?: string;
};

export interface WhatsAppWebhookResult {
  ok: boolean;
  status: number;
  processed: {
    inboundMessages: number;
    statusUpdates: number;
  };
  details?: string;
}

const DEFAULT_AUTO_REPLY =
  "Murakoze! Twakiriye ubutumwa bwawe kuri WhatsApp. Umuyobozi wa cooperative azagusubiza vuba.";

export function createWhatsAppHandler(options: WhatsAppHandlerOptions) {
  const { featureFlags, transport, logger = console, autoReplyText } = options;
  const replyText = autoReplyText?.trim() || DEFAULT_AUTO_REPLY;

  return {
    async handleWebhook(payload: WhatsAppWebhookPayload): Promise<WhatsAppWebhookResult> {
      const enabled = await featureFlags.isEnabled(FeatureFlag.WHATSAPP_BETA);

      if (!enabled) {
        logger.info?.("whatsapp webhook skipped: flag disabled");
        return {
          ok: false,
          status: 403,
          processed: { inboundMessages: 0, statusUpdates: 0 },
          details: "feature_flag_disabled",
        };
      }

      let inboundMessages = 0;
      let statusUpdates = 0;

      const entries = payload.entry ?? [];

      for (const entry of entries) {
        const changes = entry?.changes ?? [];
        for (const change of changes) {
          const value = change?.value;
          if (!value) {
            continue;
          }

          const messages = value.messages ?? [];
          for (const message of messages) {
            inboundMessages += 1;
            const messageId = message.id;
            if (messageId) {
              try {
                await transport.markAsRead(messageId);
              } catch (error) {
                logger.warn?.("whatsapp markAsRead failed", error);
              }
            }

            if (message.type === "text") {
              const body = message.text?.body?.trim();
              const recipient = message.from;

              if (recipient && body) {
                try {
                  await transport.sendAutomatedReply({
                    to: recipient,
                    body: replyText,
                    context: messageId ? { messageId } : undefined,
                  });
                } catch (error) {
                  logger.error?.("whatsapp reply failed", error);
                }
              }
            } else {
              logger.debug?.("whatsapp message ignored", { type: message.type });
            }
          }

          const statuses = value.statuses ?? [];
          if (statuses.length > 0) {
            statusUpdates += statuses.length;
            logger.debug?.("whatsapp status updates", { count: statuses.length });
          }
        }
      }

      logger.info?.("whatsapp webhook processed", { inboundMessages, statusUpdates });

      return {
        ok: true,
        status: 200,
        processed: { inboundMessages, statusUpdates },
      };
    },
  };
}
