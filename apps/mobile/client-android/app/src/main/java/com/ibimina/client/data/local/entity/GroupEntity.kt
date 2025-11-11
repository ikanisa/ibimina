package com.ibimina.client.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "groups")
data class GroupEntity(
    @PrimaryKey val id: String,
    val orgId: String,
    val countryId: String,
    val name: String,
    val amount: Double,
    val frequency: String,
    val cycle: String,
    val memberCount: Int = 0,
    val isActive: Boolean = true
)
