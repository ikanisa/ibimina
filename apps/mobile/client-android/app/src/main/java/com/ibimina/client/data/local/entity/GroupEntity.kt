package com.ibimina.client.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey
import com.ibimina.client.domain.model.Group

@Entity(tableName = "groups")
data class GroupEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "org_id") val orgId: String,
    @ColumnInfo(name = "country_id") val countryId: String,
    val name: String,
    val amount: Double,
    val frequency: String,
    val cycle: String,
    @ColumnInfo(name = "member_count") val memberCount: Int = 0,
    @ColumnInfo(name = "group_id") val groupId: String = "",
    @ColumnInfo(name = "member_code") val memberCode: String = "",
    @ColumnInfo(name = "is_active") val isActive: Boolean = true
) {
    fun toDomain(): Group = Group(
        id = id,
        orgId = orgId,
        countryId = countryId,
        name = name,
        amount = amount,
        frequency = frequency,
        cycle = cycle,
        memberCount = memberCount,
        groupId = groupId,
        memberCode = memberCode,
        isActive = isActive
    )

    companion object {
        fun fromDomain(group: Group): GroupEntity = GroupEntity(
            id = group.id,
            orgId = group.orgId,
            countryId = group.countryId,
            name = group.name,
            amount = group.amount,
            frequency = group.frequency,
            cycle = group.cycle,
            memberCount = group.memberCount,
            groupId = group.groupId,
            memberCode = group.memberCode,
            isActive = group.isActive
        )
    }
}
