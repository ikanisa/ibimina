package com.ibimina.client.data.remote.dto

import com.ibimina.client.domain.model.Group
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class GroupDto(
    val id: String,
    val name: String,
    @SerialName("group_id") val groupId: String,
    @SerialName("member_code") val memberCode: String
) {
    fun toDomain(): Group = Group(
        id = id,
        name = name,
        groupId = groupId,
        memberCode = memberCode
    )
}
