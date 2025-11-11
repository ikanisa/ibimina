package com.ibimina.client.domain.model

data class Transaction(
    val id: String,
    val amount: Double,
    val reference: String,
    val status: String,
    val createdAt: String
)
