package com.ibimina.client.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Message
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.ibimina.client.ui.screens.AssistantRoute
import com.ibimina.client.ui.screens.DashboardRoute
import com.ibimina.client.ui.screens.QrScannerRoute
import com.ibimina.client.ui.screens.SmsTriageRoute
import com.ibimina.client.ui.viewmodel.AssistantViewModel
import com.ibimina.client.ui.viewmodel.DashboardViewModel
import com.ibimina.client.ui.viewmodel.QrScannerViewModel
import com.ibimina.client.ui.viewmodel.SmsTriageViewModel
import androidx.hilt.navigation.compose.hiltViewModel

@Composable
fun AppNavHost(
    modifier: Modifier = Modifier,
    navController: NavHostController = rememberNavController(),
    dashboardScreen: @Composable () -> Unit = {
        val viewModel: DashboardViewModel = hiltViewModel()
        DashboardRoute(viewModel = viewModel)
    },
    qrScannerScreen: @Composable () -> Unit = {
        val viewModel: QrScannerViewModel = hiltViewModel()
        QrScannerRoute(viewModel = viewModel)
    },
    smsTriageScreen: @Composable () -> Unit = {
        val viewModel: SmsTriageViewModel = hiltViewModel()
        SmsTriageRoute(viewModel = viewModel)
    },
    assistantScreen: @Composable () -> Unit = {
        val viewModel: AssistantViewModel = hiltViewModel()
        AssistantRoute(viewModel = viewModel)
    }
) {
    val destinations = remember { AppDestination.all }
    Scaffold(
        modifier = modifier,
        bottomBar = {
            AppBottomBar(navController = navController, destinations = destinations)
        }
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = AppDestination.Dashboard.route,
            modifier = Modifier.padding(paddingValues)
        ) {
            composable(AppDestination.Dashboard.route) { dashboardScreen() }
            composable(AppDestination.QrScanner.route) { qrScannerScreen() }
            composable(AppDestination.SmsTriage.route) { smsTriageScreen() }
            composable(AppDestination.Assistant.route) { assistantScreen() }
        }
    }
}

@Composable
private fun AppBottomBar(
    navController: NavHostController,
    destinations: List<AppDestination>
) {
    NavigationBar {
        val backStackEntry by navController.currentBackStackEntryAsState()
        val currentRoute = backStackEntry?.destination?.route
        destinations.forEach { destination ->
            NavigationBarItem(
                selected = currentRoute == destination.route,
                onClick = {
                    if (currentRoute != destination.route) {
                        navController.navigate(destination.route) {
                            popUpTo(navController.graph.startDestinationId) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                },
                icon = {
                    Icon(
                        imageVector = destination.icon,
                        contentDescription = destination.contentDescription
                    )
                },
                label = { Text(destination.label) }
            )
        }
    }
}

sealed class AppDestination(
    val route: String,
    val label: String,
    val contentDescription: String,
    val icon: ImageVector
) {
    object Dashboard : AppDestination("dashboard", "Dashboard", "Dashboard", Icons.Default.Home)
    object QrScanner : AppDestination("qr", "QR Scanner", "QR Scanner", Icons.Default.QrCodeScanner)
    object SmsTriage : AppDestination("sms", "SMS Triage", "SMS Triage", Icons.Default.Message)
    object Assistant : AppDestination("assistant", "Assistant", "AI Assistant", Icons.Default.Chat)

    companion object {
        val all = listOf(Dashboard, QrScanner, SmsTriage, Assistant)
    }
}
