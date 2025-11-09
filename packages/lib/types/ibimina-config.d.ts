declare module "@ibimina/config" {
  export interface UssdLocaleDefinition {
    copy: string;
    cta: string;
    instructions: string[];
  }

  export interface UssdOperatorConfig {
    id: string;
    name: string;
    network: string;
    country: string;
    currency: string;
    supportsAutoDial: boolean;
    default: boolean;
    shortcode: string;
    templates: {
      shortcut: string;
      menu: string;
      base: string;
    };
    placeholders: {
      merchant: string;
      amount: string;
      reference: string;
    };
    locales: Record<string, UssdLocaleDefinition>;
  }

  export interface UssdConfig {
    version: string;
    ttlSeconds: number;
    operators: UssdOperatorConfig[];
  }

  export const ussdConfig: UssdConfig;
  export function getUssdOperatorById(id: string): UssdOperatorConfig | undefined;
  export function getDefaultUssdOperator(): UssdOperatorConfig;
}
