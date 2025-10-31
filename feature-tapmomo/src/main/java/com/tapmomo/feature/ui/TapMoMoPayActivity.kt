package com.tapmomo.feature.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import com.tapmomo.feature.ui.screens.PayScreen

/**
 * Activity for "Pay" flow (payer mode)
 */
class TapMoMoPayActivity : ComponentActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        setContent {
            MaterialTheme {
                Surface {
                    PayScreen(
                        onClose = { finish() }
                    )
                }
            }
        }
    }
}
