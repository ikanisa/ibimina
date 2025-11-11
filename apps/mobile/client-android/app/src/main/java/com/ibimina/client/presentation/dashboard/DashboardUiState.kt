package com.ibimina.client.presentation.dashboard

import com.ibimina.client.domain.model.Transaction

data class DashboardUiState(
    val isLoading: Boolean = true,
    val groupCount: Int = 0,
    val totalSaved: Double = 0.0,
    val latestTransaction: Transaction? = null,
    val errorMessage: String? = null
)
