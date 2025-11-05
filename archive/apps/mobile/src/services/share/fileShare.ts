import * as Sharing from "expo-sharing";

export interface ShareOptions {
  title?: string;
  mimeType?: string;
}

export async function shareFile(uri: string, options: ShareOptions = {}): Promise<boolean> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    console.warn("Share sheet not available on this device");
    return false;
  }

  await Sharing.shareAsync(uri, {
    mimeType: options.mimeType ?? "application/octet-stream",
    dialogTitle: options.title ?? "Share file",
  });

  return true;
}
