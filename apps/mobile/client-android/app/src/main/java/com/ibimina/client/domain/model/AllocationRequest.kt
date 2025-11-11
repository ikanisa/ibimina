package com.ibimina.client.domain.model

data class AllocationRequest(
    val orgId: String,
    val groupId: String,
    val memberId: String,
    val amount: Double,
    val rawRef: String,
    val source: String
)
