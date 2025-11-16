package com.ibimina.client.presentation.profile

import com.ibimina.client.domain.model.Group

data class ProfileUiState(
    val userId: String = "",
    val groups: List<Group> = emptyList(),
    val isLoading: Boolean = true
)
