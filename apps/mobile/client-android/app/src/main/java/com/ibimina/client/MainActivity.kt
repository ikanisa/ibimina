package com.ibimina.client

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import dagger.hilt.android.AndroidEntryPoint
import com.ibimina.client.ui.theme.IbiminaClientTheme
import com.ibimina.client.ui.navigation.AppNavHost

/**
 * MainActivity for Ibimina Client Android App
 * 
 * This is the entry point for the native Android client application.
 * Features:
 * - TapMoMo NFC payment handoff
 * - View groups and savings
 * - Payment history
 * - Member profile management
 * - Real-time sync with Supabase
 */
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            IbiminaClientTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppNavHost()
                }
            }
        }
    }
}
