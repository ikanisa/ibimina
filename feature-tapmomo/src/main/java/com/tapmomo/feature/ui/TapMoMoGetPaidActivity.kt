package com.tapmomo.feature.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import com.tapmomo.feature.Network
import com.tapmomo.feature.ui.screens.GetPaidScreen

/**
 * Activity for "Get Paid" flow (payee/merchant mode)
 */
class TapMoMoGetPaidActivity : ComponentActivity() {
    
    companion object {
        const val EXTRA_AMOUNT = "extra_amount"
        const val EXTRA_NETWORK = "extra_network"
        const val EXTRA_MERCHANT_ID = "extra_merchant_id"
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Extract intent extras
        val amount = intent.getIntExtra(EXTRA_AMOUNT, -1).takeIf { it >= 0 }
        val networkName = intent.getStringExtra(EXTRA_NETWORK) ?: Network.MTN.name
        val network = try {
            Network.valueOf(networkName)
        } catch (e: IllegalArgumentException) {
            Network.MTN
        }
        val merchantId = intent.getStringExtra(EXTRA_MERCHANT_ID) ?: ""
        
        setContent {
            MaterialTheme {
                Surface {
                    GetPaidScreen(
                        initialAmount = amount,
                        initialNetwork = network,
                        initialMerchantId = merchantId,
                        onClose = { finish() }
                    )
                }
            }
        }
    }
}
