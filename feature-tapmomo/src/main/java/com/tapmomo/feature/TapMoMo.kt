package com.tapmomo.feature

import android.content.Context
import android.content.Intent
import android.nfc.NfcAdapter
import com.tapmomo.feature.ui.TapMoMoGetPaidActivity
import com.tapmomo.feature.ui.TapMoMoPayActivity

/**
 * Main entry point for TapMoMo library.
 * Initialize this in your Application.onCreate() before using any features.
 */
object TapMoMo {
    
    private var config: TapMoMoConfig? = null
    private var isInitialized = false
    
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
    }
    
    /**
     * Get current configuration
     */
    fun getConfig(): TapMoMoConfig {
        checkInitialized()
        return config!!
    }
    
    /**
     * Check if NFC is available on this device
     */
    fun isNfcAvailable(context: Context): Boolean {
        val nfcAdapter = NfcAdapter.getDefaultAdapter(context)
        return nfcAdapter != null
    }
    
    /**
     * Check if NFC is enabled
     */
    fun isNfcEnabled(context: Context): Boolean {
        val nfcAdapter = NfcAdapter.getDefaultAdapter(context) ?: return false
        return nfcAdapter.isEnabled
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
     * USSD code templates by network
     * Default values are for Rwanda MoMo
     */
    val ussdTemplates: Map<Network, UssdTemplate> = mapOf(
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
