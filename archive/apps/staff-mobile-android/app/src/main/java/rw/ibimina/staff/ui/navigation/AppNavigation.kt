package rw.ibimina.staff.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import rw.ibimina.staff.ui.screens.auth.LoginScreen
import rw.ibimina.staff.ui.screens.home.HomeScreen
import rw.ibimina.staff.ui.screens.qr.QRScannerScreen
import rw.ibimina.staff.ui.screens.sms.SmsMonitorScreen
import rw.ibimina.staff.viewmodels.AuthViewModel

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Home : Screen("home")
    object QRScanner : Screen("qr_scanner")
    object SmsMonitor : Screen("sms_monitor")
}

@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    val authViewModel: AuthViewModel = viewModel()
    val authState by authViewModel.authState.collectAsState()

    val startDestination = if (authState.isAuthenticated) {
        Screen.Home.route
    } else {
        Screen.Login.route
    }

    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Home.route) {
            HomeScreen(
                onNavigateToQRScanner = {
                    navController.navigate(Screen.QRScanner.route)
                },
                onNavigateToSmsMonitor = {
                    navController.navigate(Screen.SmsMonitor.route)
                },
                onLogout = {
                    authViewModel.logout()
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Home.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.QRScanner.route) {
            QRScannerScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.SmsMonitor.route) {
            SmsMonitorScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}
