package com.ibimina.client.presentation.groups

import com.ibimina.client.domain.model.Group

data class GroupListUiState(
    val isLoading: Boolean = true,
    val groups: List<Group> = emptyList(),
    val errorMessage: String? = null
)
