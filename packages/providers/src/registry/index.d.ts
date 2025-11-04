/**
 * Provider Adapter Registry
 * Central registry for all statement and SMS adapters
 */
import type { ProviderAdapter, AdapterRegistryEntry, ParseResult } from "../types/adapter.js";
/**
 * Global adapter registry
 */
declare class AdapterRegistry {
  private adapters;
  /**
   * Register an adapter
   */
  register(entry: AdapterRegistryEntry): void;
  /**
   * Get all adapters for a country
   */
  getAdaptersByCountry(countryISO3: string): AdapterRegistryEntry[];
  /**
   * Get adapters by type
   */
  getAdaptersByType(type: "statement" | "sms"): AdapterRegistryEntry[];
  /**
   * Get a specific adapter
   */
  getAdapter(
    countryISO3: string,
    providerName: string,
    type: "statement" | "sms"
  ): ProviderAdapter | undefined;
  /**
   * Auto-detect and parse input using all registered adapters
   * Returns the best match based on confidence score
   */
  autoParse(input: string, type?: "statement" | "sms"): ParseResult;
  /**
   * Get all registered adapters
   */
  getAll(): AdapterRegistryEntry[];
  /**
   * Clear all adapters (useful for testing)
   */
  clear(): void;
}
export declare const adapterRegistry: AdapterRegistry;
export declare function registerDefaultAdapters(): void;
export {};
