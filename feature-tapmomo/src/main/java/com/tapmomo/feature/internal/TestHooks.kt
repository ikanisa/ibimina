package com.tapmomo.feature.internal

import android.content.Context

/**
 * Internal test hooks that allow instrumentation tests to override hardware
 * dependencies such as NFC and USSD diallers. These hooks are never invoked in
 * production builds.
 */
internal object TestHooks {
    @Volatile
    var nfcAvailabilityOverride: ((Context) -> Boolean)? = null

    @Volatile
    var nfcEnabledOverride: ((Context) -> Boolean)? = null

    @Volatile
    var ussdDirectHandler: ((Context, String, Int?) -> Boolean)? = null

    @Volatile
    var ussdDialHandler: ((Context, String) -> Boolean)? = null

    fun reset() {
        nfcAvailabilityOverride = null
        nfcEnabledOverride = null
        ussdDirectHandler = null
        ussdDialHandler = null
    }
}
