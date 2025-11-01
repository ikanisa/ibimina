declare module "@capacitor/core" {
  export interface CapacitorGlobal {
    isNativePlatform(): boolean;
    isPluginAvailable(name: string): boolean;
  }
  export const Capacitor: CapacitorGlobal;
}
