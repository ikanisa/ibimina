export interface GlanceWidgetEntry {
  id: string;
  title: string;
  subtitle?: string;
  deepLink: string;
  lastUpdated: string;
}

export interface GlanceBridge {
  publish(entries: GlanceWidgetEntry[]): Promise<void>;
}

let glanceBridge: GlanceBridge | null = null;

export function registerGlanceBridge(implementation: GlanceBridge) {
  glanceBridge = implementation;
}

export async function publishGlanceWidgets(entries: GlanceWidgetEntry[]): Promise<void> {
  if (!glanceBridge) {
    console.warn("Glance bridge not registered");
    return;
  }
  await glanceBridge.publish(entries);
}
