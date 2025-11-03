export interface WidgetIntentPayload {
  kind: "balance" | "pay" | "reference";
  deepLink: string;
  metadata?: Record<string, string>;
}

export interface WidgetTimelineEntry {
  date: string;
  configuration: WidgetIntentPayload;
}

export interface WidgetKitBridge {
  sync(entries: WidgetTimelineEntry[]): Promise<void>;
}

let bridge: WidgetKitBridge | null = null;

export function registerWidgetKitBridge(implementation: WidgetKitBridge) {
  bridge = implementation;
}

export async function syncWidgetKit(entries: WidgetTimelineEntry[]): Promise<void> {
  if (!bridge) {
    console.warn("WidgetKit bridge not registered");
    return;
  }
  await bridge.sync(entries);
}
