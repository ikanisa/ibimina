package com.ibimina.client.presentation.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.History
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.ibimina.client.presentation.dashboard.DashboardScreen
import com.ibimina.client.presentation.groups.GroupListScreen
import com.ibimina.client.presentation.nfc.NfcScanScreen
import com.ibimina.client.presentation.nfc.NfcViewModel
import com.ibimina.client.presentation.nfc.NfcWriteScreen
import com.ibimina.client.presentation.profile.ProfileScreen
import com.ibimina.client.presentation.transactions.TransactionHistoryScreen

@Composable
fun IbiminaNavHost(modifier: Modifier = Modifier) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination
    val activity = LocalContext.current as androidx.activity.ComponentActivity
    val sharedNfcViewModel: NfcViewModel = hiltViewModel(activity)

    Scaffold(
        bottomBar = {
            NavigationBar {
                IbiminaDestination.bottomNavigationItems.forEach { destination ->
                    val icon = when (destination) {
                        IbiminaDestination.Dashboard -> Icons.Default.Dashboard
                        IbiminaDestination.Groups -> Icons.Default.Group
                        IbiminaDestination.Transactions -> Icons.Default.History
                        IbiminaDestination.Profile -> Icons.Default.AccountCircle
                        else -> Icons.Default.CreditCard
                    }
                    val selected = currentDestination?.hierarchy?.any { it.route == destination.route } == true
                    NavigationBarItem(
                        selected = selected,
                        onClick = {
                            if (!selected) {
                                navController.navigate(destination.route) {
                                    launchSingleTop = true
                                    restoreState = true
                                    popUpTo(navController.graph.startDestinationId) {
                                        saveState = true
                                    }
                                }
                            }
                        },
                        icon = { Icon(icon, contentDescription = destination.label) },
                        label = null
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = IbiminaDestination.Dashboard.route,
            modifier = modifier.padding(innerPadding)
        ) {
            composable(IbiminaDestination.Dashboard.route) {
                DashboardScreen(
                    viewModel = hiltViewModel(),
                    onScanTap = { navController.navigate(IbiminaDestination.NfcScan.route) },
                    onWriteTap = { navController.navigate(IbiminaDestination.NfcWrite.route) }
                )
            }
            composable(IbiminaDestination.Groups.route) {
                GroupListScreen(viewModel = hiltViewModel())
            }
            composable(IbiminaDestination.Transactions.route) {
                TransactionHistoryScreen(viewModel = hiltViewModel())
            }
            composable(IbiminaDestination.NfcScan.route) {
                NfcScanScreen(viewModel = sharedNfcViewModel)
            }
            composable(IbiminaDestination.NfcWrite.route) {
                NfcWriteScreen(viewModel = sharedNfcViewModel)
            }
            composable(IbiminaDestination.Profile.route) {
                ProfileScreen(viewModel = hiltViewModel())
            }
        }
    }
}
