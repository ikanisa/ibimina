package com.ibimina.staff.services

import com.aallam.openai.api.chat.ChatCompletion
import com.aallam.openai.api.chat.ChatCompletionRequest
import com.aallam.openai.api.chat.ChatMessage
import com.aallam.openai.api.chat.ChatRole
import com.aallam.openai.api.model.ModelId
import com.aallam.openai.client.OpenAI
import javax.inject.Inject
import javax.inject.Singleton

/**
 * OpenAI Service for AI-powered assistance in the staff app
 * 
 * Features:
 * - Natural language transaction queries
 * - Member information lookup
 * - Report generation assistance
 * - Data analysis and insights
 */
@Singleton
class OpenAIService @Inject constructor() {
    
    private val openAI = OpenAI(apiKey = BuildConfig.OPENAI_API_KEY)
    
    /**
     * Send a chat message and get AI response
     */
    suspend fun chat(userMessage: String, context: String? = null): String {
        val messages = mutableListOf<ChatMessage>()
        
        // Add system context if provided
        if (context != null) {
            messages.add(
                ChatMessage(
                    role = ChatRole.System,
                    content = "You are an AI assistant for Ibimina SACCO staff. $context"
                )
            )
        } else {
            messages.add(
                ChatMessage(
                    role = ChatRole.System,
                    content = "You are an AI assistant for Ibimina SACCO staff. Help with member queries, transaction lookups, and data analysis."
                )
            )
        }
        
        // Add user message
        messages.add(
            ChatMessage(
                role = ChatRole.User,
                content = userMessage
            )
        )
        
        val chatCompletionRequest = ChatCompletionRequest(
            model = ModelId("gpt-4"),
            messages = messages,
            temperature = 0.7,
            maxTokens = 500
        )
        
        return try {
            val completion: ChatCompletion = openAI.chatCompletion(chatCompletionRequest)
            completion.choices.firstOrNull()?.message?.content ?: "No response from AI"
        } catch (e: Exception) {
            "Error: ${e.message}"
        }
    }
    
    /**
     * Analyze transaction data and provide insights
     */
    suspend fun analyzeTransactions(transactionData: String): String {
        val prompt = """
            Analyze the following transaction data and provide insights:
            - Total transactions
            - Average transaction amount
            - Most active members
            - Any unusual patterns
            
            Data: $transactionData
        """.trimIndent()
        
        return chat(prompt, "You are a financial data analyst for a SACCO.")
    }
    
    /**
     * Help generate reports based on natural language query
     */
    suspend fun generateReport(reportRequest: String): String {
        val prompt = """
            Generate a report based on this request: $reportRequest
            
            Provide a structured format suitable for a SACCO report.
        """.trimIndent()
        
        return chat(prompt, "You are a report generator for SACCO operations.")
    }
}
