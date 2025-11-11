package com.ibimina.client.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.ibimina.client.domain.model.Group
import com.ibimina.client.domain.model.GroupSettings

/**
 * Room entity for Group
 */
@Entity(tableName = "groups")
data class GroupEntity(
    @PrimaryKey val id: String,
    val name: String,
    val orgId: String,
    val memberCode: String,
    val contributionAmount: Double,
    val contributionFrequency: String,
    val cycleDuration: Int,
    val memberCount: Int,
    val totalSavings: Double,
    val isActive: Boolean
) {
    fun toDomain(): Group {
        return Group(
            id = id,
            name = name,
            orgId = orgId,
            memberCode = memberCode,
            settings = GroupSettings(
                contributionAmount = contributionAmount,
                contributionFrequency = contributionFrequency,
                cycleDuration = cycleDuration
            ),
            memberCount = memberCount,
            totalSavings = totalSavings,
            isActive = isActive
        )
    }
    
    companion object {
        fun fromDomain(group: Group): GroupEntity {
            return GroupEntity(
                id = group.id,
                name = group.name,
                orgId = group.orgId,
                memberCode = group.memberCode,
                contributionAmount = group.settings.contributionAmount,
                contributionFrequency = group.settings.contributionFrequency,
                cycleDuration = group.settings.cycleDuration,
                memberCount = group.memberCount,
                totalSavings = group.totalSavings,
                isActive = group.isActive
            )
        }
    }
}
