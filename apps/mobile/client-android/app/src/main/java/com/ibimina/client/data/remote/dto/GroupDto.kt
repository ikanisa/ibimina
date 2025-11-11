package com.ibimina.client.data.remote.dto

import com.google.gson.annotations.SerializedName
import com.ibimina.client.domain.model.Group
import com.ibimina.client.domain.model.GroupSettings

/**
 * DTO for Group from API
 */
data class GroupDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("org_id") val orgId: String,
    @SerializedName("member_code") val memberCode: String,
    @SerializedName("settings") val settings: GroupSettingsDto,
    @SerializedName("member_count") val memberCount: Int = 0,
    @SerializedName("total_savings") val totalSavings: Double = 0.0,
    @SerializedName("is_active") val isActive: Boolean = true
) {
    fun toDomain(): Group {
        return Group(
            id = id,
            name = name,
            orgId = orgId,
            memberCode = memberCode,
            settings = settings.toDomain(),
            memberCount = memberCount,
            totalSavings = totalSavings,
            isActive = isActive
        )
    }
}

data class GroupSettingsDto(
    @SerializedName("amount") val contributionAmount: Double,
    @SerializedName("frequency") val contributionFrequency: String,
    @SerializedName("cycle") val cycleDuration: Int
) {
    fun toDomain(): GroupSettings {
        return GroupSettings(
            contributionAmount = contributionAmount,
            contributionFrequency = contributionFrequency,
            cycleDuration = cycleDuration
        )
    }
}
