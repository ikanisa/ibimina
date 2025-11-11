package com.ibimina.client.presentation.navigation

sealed class IbiminaDestination(val route: String, val label: String) {
    object Dashboard : IbiminaDestination("dashboard", "Dashboard")
    object Groups : IbiminaDestination("groups", "Groups")
    object Transactions : IbiminaDestination("transactions", "Transactions")
    object NfcScan : IbiminaDestination("nfcScan", "NFC Scan")
    object NfcWrite : IbiminaDestination("nfcWrite", "NFC Write")
    object Profile : IbiminaDestination("profile", "Profile")

    companion object {
        val bottomNavigationItems = listOf(Dashboard, Groups, Transactions, Profile)
    }
}
