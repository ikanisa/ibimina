/**
 * Provider Adapter Registry
 * Central registry for all statement and SMS adapters
 */
// Import Rwanda adapters
import { MTNRwandaStatementAdapter } from "../adapters/RW/MTNStatementAdapter.js";
import { MTNRwandaSmsAdapter } from "../adapters/RW/MTNSmsAdapter.js";
/**
 * Global adapter registry
 */
class AdapterRegistry {
    adapters = [];
    /**
     * Register an adapter
     */
    register(entry) {
        this.adapters.push(entry);
        // Sort by priority (highest first)
        this.adapters.sort((a, b) => b.priority - a.priority);
    }
    /**
     * Get all adapters for a country
     */
    getAdaptersByCountry(countryISO3) {
        return this.adapters.filter((entry) => entry.countryISO3.toUpperCase() === countryISO3.toUpperCase());
    }
    /**
     * Get adapters by type
     */
    getAdaptersByType(type) {
        return this.adapters.filter((entry) => entry.type === type);
    }
    /**
     * Get a specific adapter
     */
    getAdapter(countryISO3, providerName, type) {
        const entry = this.adapters.find((e) => e.countryISO3.toUpperCase() === countryISO3.toUpperCase() &&
            e.providerName.toLowerCase() === providerName.toLowerCase() &&
            e.type === type);
        return entry?.adapter;
    }
    /**
     * Auto-detect and parse input using all registered adapters
     * Returns the best match based on confidence score
     */
    autoParse(input, type) {
        let bestResult = null;
        let bestConfidence = 0;
        const candidates = type ? this.getAdaptersByType(type) : this.adapters;
        for (const entry of candidates) {
            const adapter = entry.adapter;
            // Check if adapter can handle this input
            if (!adapter.canHandle(input)) {
                continue;
            }
            // Try to parse
            const result = adapter.parse(input);
            // Track best result
            if (result.success && result.confidence > bestConfidence) {
                bestResult = result;
                bestConfidence = result.confidence;
            }
        }
        if (bestResult) {
            return bestResult;
        }
        // No adapter could parse
        return {
            success: false,
            confidence: 0,
            error: "No adapter could parse the input",
        };
    }
    /**
     * Get all registered adapters
     */
    getAll() {
        return [...this.adapters];
    }
    /**
     * Clear all adapters (useful for testing)
     */
    clear() {
        this.adapters = [];
    }
}
// Create singleton instance
export const adapterRegistry = new AdapterRegistry();
// Register default adapters
export function registerDefaultAdapters() {
    // Rwanda - MTN Statement
    adapterRegistry.register({
        adapter: new MTNRwandaStatementAdapter(),
        type: "statement",
        countryISO3: "RWA",
        providerName: "MTN Rwanda",
        priority: 100,
    });
    // Rwanda - MTN SMS
    adapterRegistry.register({
        adapter: new MTNRwandaSmsAdapter(),
        type: "sms",
        countryISO3: "RWA",
        providerName: "MTN Rwanda",
        priority: 100,
    });
    // Additional adapters can be registered here as they are implemented
    // Example:
    // adapterRegistry.register({
    //   adapter: new OrangeSenegalStatementAdapter(),
    //   type: 'statement',
    //   countryISO3: 'SEN',
    //   providerName: 'Orange Senegal',
    //   priority: 100,
    // });
}
// Auto-register defaults
registerDefaultAdapters();
