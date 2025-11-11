package com.ibimina.client.domain.model

/**
 * Domain entity representing a user group (ikimina)
 */
data class Group(
    val id: String,
    val name: String,
    val orgId: String,
    val memberCode: String,
    val settings: GroupSettings,
    val memberCount: Int = 0,
    val totalSavings: Double = 0.0,
    val isActive: Boolean = true
)

data class GroupSettings(
    val contributionAmount: Double,
    val contributionFrequency: String, // weekly, monthly
    val cycleDuration: Int // in days
)
