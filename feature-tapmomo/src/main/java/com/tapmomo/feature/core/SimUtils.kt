package com.tapmomo.feature.core

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SubscriptionInfo
import android.telephony.SubscriptionManager
import androidx.core.content.ContextCompat
import com.tapmomo.feature.data.models.SimInfo

/**
 * SIM card management utilities for dual-SIM devices
 */
object SimUtils {
    
    /**
     * Check if READ_PHONE_STATE permission is granted
     */
    fun hasPhonePermission(context: Context): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.READ_PHONE_STATE
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    /**
     * Get list of active SIM cards
     */
    fun getActiveSimCards(context: Context): List<SimInfo> {
        if (!hasPhonePermission(context)) {
            return emptyList()
        }
        
        try {
            val subscriptionManager = context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) 
                as? SubscriptionManager ?: return emptyList()
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
                val activeSubscriptions = subscriptionManager.activeSubscriptionInfoList ?: emptyList()
                
                return activeSubscriptions.map { info ->
                    SimInfo(
                        subscriptionId = info.subscriptionId,
                        displayName = info.displayName?.toString() ?: "SIM ${info.simSlotIndex + 1}",
                        carrierName = info.carrierName?.toString() ?: "Unknown",
                        slotIndex = info.simSlotIndex
                    )
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        
        return emptyList()
    }
    
    /**
     * Check if device has multiple SIM cards
     */
    fun isDualSim(context: Context): Boolean {
        return getActiveSimCards(context).size > 1
    }
    
    /**
     * Get default SIM subscription ID
     */
    fun getDefaultSimSubscriptionId(context: Context): Int? {
        val simCards = getActiveSimCards(context)
        return simCards.firstOrNull()?.subscriptionId
    }
}
