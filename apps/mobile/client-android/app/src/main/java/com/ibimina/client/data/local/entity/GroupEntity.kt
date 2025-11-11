package com.ibimina.client.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey
import com.ibimina.client.domain.model.Group

@Entity(tableName = "groups")
data class GroupEntity(
    @PrimaryKey val id: String,
    val name: String,
    @ColumnInfo(name = "group_id") val groupId: String,
    @ColumnInfo(name = "member_code") val memberCode: String
) {
    fun toDomain(): Group = Group(
        id = id,
        name = name,
        groupId = groupId,
        memberCode = memberCode
    )

    companion object {
        fun fromDomain(group: Group): GroupEntity = GroupEntity(
            id = group.id,
            name = group.name,
            groupId = group.groupId,
            memberCode = group.memberCode
        )
    }
}
