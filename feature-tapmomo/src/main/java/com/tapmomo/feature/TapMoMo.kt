package com.tapmomo.feature

import android.content.Context
import android.content.Intent
import android.nfc.NfcAdapter
import android.os.Build
import com.tapmomo.feature.internal.TestHooks
import com.tapmomo.feature.telemetry.TelemetryLogger
import com.tapmomo.feature.ui.TapMoMoGetPaidActivity
import com.tapmomo.feature.ui.TapMoMoPayActivity
import java.util.concurrent.TimeUnit

/**
 * Main entry point for TapMoMo library.
 * Initialize this in your Application.onCreate() before using any features.
 */
object TapMoMo {

    private var config: TapMoMoConfig? = null
    private var isInitialized = false
    private val nfcUnavailableLogged = AtomicBoolean(false)
    private val nfcDisabledLogged = AtomicBoolean(false)

    /**
     * Initialize TapMoMo with configuration.
     * Call this once in Application.onCreate()
     */
    fun init(context: Context, config: TapMoMoConfig) {
        this.config = config
        this.isInitialized = true

        // Initialize internal components
        initializeDatabase(context.applicationContext)
        initializeSupabaseClient(config)
        TelemetryLogger.initialize(context.applicationContext)
        TelemetryLogger.track(
            "tapmomo_initialized",
            mapOf(
                "networks" to config.networks.size,
                "requiresSignature" to config.requireSignature,
            ),
        )
    }
    
    /**
     * Get current configuration
     */
    fun getConfig(): TapMoMoConfig {
        checkInitialized()
        return config!!
    }

    fun refreshUssdTemplates(bundle: UssdTemplateBundle) {
        checkInitialized()
        val current = config!!
        config = current.copy(ussdTemplateBundle = bundle.withFetchedAt(System.currentTimeMillis()))
    }
    
    /**
     * Check if NFC is available on this device
     */
    fun isNfcAvailable(context: Context): Boolean {
        TestHooks.nfcAvailabilityOverride?.let { override ->
            return override(context)
        }

        val nfcAdapter = NfcAdapter.getDefaultAdapter(context)
        val available = nfcAdapter != null
        if (!available && nfcUnavailableLogged.compareAndSet(false, true)) {
            TelemetryLogger.track(
                "tapmomo_nfc_unavailable",
                mapOf(
                    "manufacturer" to Build.MANUFACTURER,
                    "model" to Build.MODEL,
                ),
            )
        }
        return available
    }

    /**
     * Check if NFC is enabled
     */
    fun isNfcEnabled(context: Context): Boolean {
        TestHooks.nfcEnabledOverride?.let { override ->
            return override(context)
        }

        val nfcAdapter = NfcAdapter.getDefaultAdapter(context) ?: run {
            if (nfcUnavailableLogged.compareAndSet(false, true)) {
                TelemetryLogger.track("tapmomo_nfc_unavailable", emptyMap())
            }
            return false
        }
        val enabled = nfcAdapter.isEnabled
        if (!enabled && nfcDisabledLogged.compareAndSet(false, true)) {
            TelemetryLogger.track("tapmomo_nfc_disabled", emptyMap())
        }
        return enabled
    }
    
    /**
     * Open "Get Paid" screen to receive payment via NFC
     */
    fun openGetPaid(
        context: Context,
        amount: Int? = null,
        network: Network,
        merchantId: String
    ) {
        checkInitialized()
        TelemetryLogger.track(
            "tapmomo_get_paid_attempt",
            mapOf(
                "network" to network.name,
                "amountProvided" to (amount != null),
            ),
        )
        val intent = Intent(context, TapMoMoGetPaidActivity::class.java).apply {
            putExtra(TapMoMoGetPaidActivity.EXTRA_AMOUNT, amount)
            putExtra(TapMoMoGetPaidActivity.EXTRA_NETWORK, network.name)
            putExtra(TapMoMoGetPaidActivity.EXTRA_MERCHANT_ID, merchantId)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }
    
    /**
     * Open "Pay" screen to make payment via NFC
     */
    fun openPay(context: Context) {
        checkInitialized()
        TelemetryLogger.track("tapmomo_pay_attempt")
        val intent = Intent(context, TapMoMoPayActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }
    
    private fun checkInitialized() {
        if (!isInitialized) {
            throw IllegalStateException(
                "TapMoMo not initialized. Call TapMoMo.init() in Application.onCreate()"
            )
        }
    }
    
    private fun initializeDatabase(context: Context) {
        // Database initialization happens lazily via Room
        com.tapmomo.feature.data.TapMoMoDatabase.getInstance(context)
    }
    
    private fun initializeSupabaseClient(config: TapMoMoConfig) {
        if (config.supabaseUrl != null && config.supabaseAnonKey != null) {
            com.tapmomo.feature.data.SupabaseClient.initialize(
                url = config.supabaseUrl,
                anonKey = config.supabaseAnonKey,
                reconcileUrl = config.reconcileFunctionUrl
            )
        }
    }
}

/**
 * Configuration for TapMoMo library
 */
data class TapMoMoConfig(
    /**
     * Supabase project URL (optional)
     * Required for merchant profile fetching and transaction reconciliation
     */
    val supabaseUrl: String? = null,
    
    /**
     * Supabase anonymous key (optional)
     * Required for merchant profile fetching and transaction reconciliation
     */
    val supabaseAnonKey: String? = null,
    
    /**
     * Edge Function URL for transaction reconciliation (optional)
     */
    val reconcileFunctionUrl: String? = null,
    
    /**
     * Default currency code
     */
    val defaultCurrency: String = "RWF",
    
    /**
     * Supported mobile money networks
     */
    val networks: Set<Network> = setOf(Network.MTN, Network.Airtel),
    
    /**
     * HCE service TTL in milliseconds (max time NFC stays active)
     */
    val hceTtlMs: Long = 45_000,
    
    /**
     * Require HMAC signature verification on payments
     */
    val requireSignature: Boolean = true,
    
    /**
     * Allow unsigned payments with warning prompt
     */
    val allowUnsignedWithWarning: Boolean = true,
    
    /**
     * Use USSD shortcut when amount is present (faster than menu navigation)
     */
    val useUssdShortcutWhenAmountPresent: Boolean = true,
    
    /**
     * USSD templates bundle (with versioning & TTL)
     */
    val ussdTemplateBundle: UssdTemplateBundle = UssdTemplateBundle.default()
) {
    val ussdTemplates: Map<Network, UssdTemplate>
        get() = ussdTemplateBundle.templates
}

/**
 * USSD code templates for a network
 */
data class UssdTemplate(
    val shortcut: String,  // When amount & merchant are known
    val menu: String,      // When only merchant is known
    val base: String       // Base MoMo menu
)

/**
 * Supported mobile money networks
 */
enum class Network {
    MTN,
    Airtel
}

data class UssdTemplateBundle(
    val version: String,
    val ttlMs: Long,
    val fetchedAtMs: Long = System.currentTimeMillis(),
    val templates: Map<Network, UssdTemplate>
) {
    fun get(network: Network): UssdTemplate? = templates[network]

    fun isExpired(nowMs: Long = System.currentTimeMillis()): Boolean {
        return nowMs - fetchedAtMs >= ttlMs
    }

    fun withFetchedAt(fetchedAt: Long): UssdTemplateBundle {
        return copy(fetchedAtMs = fetchedAt)
    }

    companion object {
        private const val DEFAULT_VERSION = "config-2025-01-15"
        private const val DEFAULT_TTL_SECONDS = 86_400L

        fun default(): UssdTemplateBundle {
            return UssdTemplateBundle(
                version = DEFAULT_VERSION,
                ttlMs = TimeUnit.SECONDS.toMillis(DEFAULT_TTL_SECONDS),
                templates = mapOf(
                    Network.MTN to UssdTemplate(
                        shortcut = "*182*8*1*{MERCHANT}*{AMOUNT}#",
                        menu = "*182*8*1#",
                        base = "*182#"
                    ),
                    Network.Airtel to UssdTemplate(
                        shortcut = "*182*8*1*{MERCHANT}*{AMOUNT}#",
                        menu = "*182*8*1#",
                        base = "*182#"
                    )
                )
            )
        }

        fun from(
            version: String,
            ttlSeconds: Long,
            templates: Map<Network, UssdTemplate>,
            fetchedAtMs: Long = System.currentTimeMillis()
        ): UssdTemplateBundle {
            return UssdTemplateBundle(
                version = version,
                ttlMs = TimeUnit.SECONDS.toMillis(ttlSeconds),
                fetchedAtMs = fetchedAtMs,
                templates = templates
            )
        }
    }
}
