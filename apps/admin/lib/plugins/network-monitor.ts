export type ConnectionType = "wifi" | "cellular" | "ethernet" | "bluetooth" | "none" | "unknown";

export interface NetworkStatus {
  connected: boolean;
  connectionType: ConnectionType;
  isMetered?: boolean;
  linkDownstreamBandwidthKbps?: number;
  linkUpstreamBandwidthKbps?: number;
}

type Listener = (status: NetworkStatus) => void;

const listeners = new Set<Listener>();

function getConnectionType(): ConnectionType {
  if (typeof navigator === "undefined") {
    return "unknown";
  }

  const connection = (navigator as Navigator & { connection?: { type?: string } }).connection;
  if (!connection || !connection.type) {
    return navigator.onLine ? "wifi" : "none";
  }

  const type = connection.type.toLowerCase();
  if (type.includes("wifi")) return "wifi";
  if (type.includes("cell")) return "cellular";
  if (type.includes("ethernet")) return "ethernet";
  if (type.includes("bluetooth")) return "bluetooth";
  return "unknown";
}

function currentStatus(): NetworkStatus {
  const connected = typeof navigator !== "undefined" ? navigator.onLine : true;
  return {
    connected,
    connectionType: connected ? getConnectionType() : "none",
  };
}

function notify(status: NetworkStatus) {
  listeners.forEach((listener) => {
    try {
      listener(status);
    } catch (error) {
      console.error("Network monitor listener failed", error);
    }
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => notify(currentStatus()));
  window.addEventListener("offline", () => notify(currentStatus()));
}

export const NetworkMonitor = {
  async getStatus(): Promise<NetworkStatus> {
    return currentStatus();
  },

  async startMonitoring(): Promise<{ success: boolean }> {
    notify(currentStatus());
    return { success: true };
  },

  async stopMonitoring(): Promise<{ success: boolean }> {
    listeners.clear();
    return { success: true };
  },

  async addListener(
    eventName: "networkStatusChange",
    listenerFunc: Listener
  ): Promise<{ remove: () => void }> {
    if (eventName !== "networkStatusChange") {
      throw new Error(`Unsupported event: ${eventName}`);
    }

    listeners.add(listenerFunc);
    return {
      remove: () => {
        listeners.delete(listenerFunc);
      },
    };
  },
};

export default NetworkMonitor;
