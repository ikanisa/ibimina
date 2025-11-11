package com.ibimina.staff.ui.navigation

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp

/**
 * AppNavigation for Ibimina Staff App
 * 
 * Main navigation component for the staff application.
 * This is a placeholder implementation that will be expanded
 * with actual navigation and screens.
 */
@Composable
fun AppNavigation() {
    // Placeholder home screen
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Ibimina Staff",
                style = MaterialTheme.typography.headlineLarge,
                textAlign = TextAlign.Center
            )
            Text(
                text = "Staff Administration Console",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(32.dp))
            Text(
                text = "Features:",
                style = MaterialTheme.typography.titleMedium
            )
            Column(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("• QR Code Scanning")
                Text("• MoMo SMS Parsing")
                Text("• OpenAI Integration")
                Text("• Real-time Supabase Sync")
            }
        }
    }
}
