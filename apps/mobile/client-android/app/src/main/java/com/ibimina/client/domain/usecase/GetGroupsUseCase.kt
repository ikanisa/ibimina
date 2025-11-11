package com.ibimina.client.domain.usecase

import com.ibimina.client.domain.model.Group
import com.ibimina.client.domain.repository.GroupRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

/**
 * Use case for retrieving user groups
 */
class GetGroupsUseCase @Inject constructor(
    private val groupRepository: GroupRepository
) {
    suspend operator fun invoke(userId: String): Flow<List<Group>> {
        return groupRepository.getUserGroups(userId)
    }
}
