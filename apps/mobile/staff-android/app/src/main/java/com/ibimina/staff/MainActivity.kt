package com.ibimina.staff

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import dagger.hilt.android.AndroidEntryPoint
import com.ibimina.staff.ui.theme.IbiminaStaffTheme
import com.ibimina.staff.ui.navigation.AppNavigation

/**
 * MainActivity for Ibimina Staff Android App
 * 
 * This is the entry point for the native Android staff/admin application.
 * Features:
 * - QR code scanning for member verification
 * - MoMo SMS parsing for transaction reconciliation
 * - OpenAI integration for AI assistance
 * - Real-time data sync with Supabase
 */
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            IbiminaStaffTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppNavigation()
                }
            }
        }
    }
}
