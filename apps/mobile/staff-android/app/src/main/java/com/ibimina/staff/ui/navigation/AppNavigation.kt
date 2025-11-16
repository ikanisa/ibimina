package com.ibimina.staff.ui.navigation

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Sms
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.ibimina.staff.ui.ai.AiAssistantScreen
import com.ibimina.staff.ui.qr.QrScannerScreen
import com.ibimina.staff.ui.sms.SmsInboxScreen

private enum class StaffDestination(val title: String) {
    Sms("MoMo Inbox"),
    Qr("QR Scanner"),
    Ai("AI Assistant")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppNavigation(modifier: Modifier = Modifier) {
    var selected by rememberSaveable { mutableStateOf(StaffDestination.Sms) }
    Scaffold(
        modifier = modifier.fillMaxSize(),
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text(text = selected.title) }
            )
        },
        bottomBar = {
            NavigationBar {
                StaffDestination.values().forEach { destination ->
                    NavigationBarItem(
                        selected = destination == selected,
                        onClick = { selected = destination },
                        icon = {
                            Icon(
                                imageVector = when (destination) {
                                    StaffDestination.Sms -> Icons.Default.Sms
                                    StaffDestination.Qr -> Icons.Default.QrCodeScanner
                                    StaffDestination.Ai -> Icons.Default.Chat
                                },
                                contentDescription = destination.title
                            )
                        },
                        label = { Text(text = destination.title) }
                    )
                }
            }
        }
    ) { innerPadding ->
        val contentModifier = Modifier
            .fillMaxSize()
            .padding(innerPadding)
        when (selected) {
            StaffDestination.Sms -> SmsInboxScreen(modifier = contentModifier)
            StaffDestination.Qr -> QrScannerScreen(modifier = contentModifier)
            StaffDestination.Ai -> AiAssistantScreen(modifier = contentModifier)
        }
    }
}
