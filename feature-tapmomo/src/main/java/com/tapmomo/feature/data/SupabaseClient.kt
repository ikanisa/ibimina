package com.tapmomo.feature.data

import io.ktor.client.*
import io.ktor.client.engine.okhttp.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json

/**
 * Supabase client for optional backend integration
 */
object SupabaseClient {
    
    private var httpClient: HttpClient? = null
    private var baseUrl: String? = null
    private var anonKey: String? = null
    private var reconcileUrl: String? = null
    
    fun initialize(url: String, anonKey: String, reconcileUrl: String?) {
        this.baseUrl = url
        this.anonKey = anonKey
        this.reconcileUrl = reconcileUrl
        
        httpClient = HttpClient(OkHttp) {
            install(ContentNegotiation) {
                json(Json {
                    ignoreUnknownKeys = true
                    isLenient = true
                    encodeDefaults = true
                })
            }
        }
    }
    
    fun isInitialized(): Boolean {
        return httpClient != null && baseUrl != null && anonKey != null
    }
    
    suspend fun fetchMerchantSecret(merchantId: String): String? {
        if (!isInitialized()) return null
        
        try {
            val response: HttpResponse = httpClient!!.get("$baseUrl/rest/v1/merchants") {
                parameter("id", "eq.$merchantId")
                parameter("select", "secret_key")
                header("apikey", anonKey)
                header("Authorization", "Bearer $anonKey")
            }
            
            if (response.status.isSuccess()) {
                // Parse and extract secret_key from response
                // This is a simplified implementation
                return response.bodyAsText()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        
        return null
    }
    
    suspend fun reconcileTransaction(
        transactionId: String,
        merchantId: String,
        amount: Int,
        status: String
    ): Boolean {
        if (!isInitialized() || reconcileUrl == null) return false
        
        try {
            val response: HttpResponse = httpClient!!.post(reconcileUrl!!) {
                contentType(ContentType.Application.Json)
                header("Authorization", "Bearer $anonKey")
                setBody(
                    mapOf(
                        "transaction_id" to transactionId,
                        "merchant_id" to merchantId,
                        "amount" to amount,
                        "status" to status
                    )
                )
            }
            
            return response.status.isSuccess()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        
        return false
    }
    
    fun close() {
        httpClient?.close()
        httpClient = null
    }
}
