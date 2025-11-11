package com.ibimina.client.data.remote.api

import com.ibimina.client.data.remote.dto.AllocationDto
import com.ibimina.client.data.remote.dto.GroupDto
import com.ibimina.client.data.remote.dto.PaymentDto
import retrofit2.Response
import retrofit2.http.*

/**
 * Retrofit API interface for Ibimina backend
 */
interface IbiminaApi {
    
    @GET("groups")
    suspend fun getUserGroups(
        @Query("user_id") userId: String
    ): Response<List<GroupDto>>
    
    @GET("groups/{id}")
    suspend fun getGroupById(
        @Path("id") groupId: String
    ): Response<GroupDto>
    
    @GET("allocations")
    suspend fun getPayments(
        @Query("member_id") memberId: String
    ): Response<List<PaymentDto>>
    
    @POST("allocations")
    suspend fun createAllocation(
        @Body allocation: AllocationDto
    ): Response<PaymentDto>
    
    @PATCH("allocations/{id}")
    suspend fun updateAllocationStatus(
        @Path("id") allocationId: String,
        @Body status: Map<String, String>
    ): Response<PaymentDto>
}
