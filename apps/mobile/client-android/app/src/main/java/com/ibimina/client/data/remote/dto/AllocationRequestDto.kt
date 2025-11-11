package com.ibimina.client.data.remote.dto

import com.ibimina.client.domain.model.AllocationRequest
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class AllocationRequestDto(
    @SerialName("org_id") val orgId: String,
    @SerialName("group_id") val groupId: String,
    @SerialName("member_id") val memberId: String,
    val amount: Double,
    @SerialName("raw_ref") val rawRef: String,
    val source: String
) {
    companion object {
        fun fromDomain(request: AllocationRequest) = AllocationRequestDto(
            orgId = request.orgId,
            groupId = request.groupId,
            memberId = request.memberId,
            amount = request.amount,
            rawRef = request.rawRef,
            source = request.source
        )
    }
}
