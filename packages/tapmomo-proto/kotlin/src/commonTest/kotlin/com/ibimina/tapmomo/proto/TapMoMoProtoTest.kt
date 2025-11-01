package com.ibimina.tapmomo.proto

import kotlinx.datetime.Instant
import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue
import kotlin.test.assertFailsWith

class TapMoMoProtoTest {
    private val basePayload = TapMoMoPayload(
        ver = 1,
        network = "MTN",
        merchantId = "merchant-123",
        currency = "NGN",
        amount = 5000,
        ref = "INV-1",
        ts = 1_700_000_000_000,
        nonce = "abc-123"
    )

    @Test
    fun `signature verification succeeds with correct secret`() {
        val secret = "super-secret"
        val signed = TapMoMoSigner.attachSignature(basePayload, secret)
        assertTrue(TapMoMoSigner.verify(signed, secret))
    }

    @Test
    fun `signature verification fails with different secret`() {
        val secret = "super-secret"
        val signed = TapMoMoSigner.attachSignature(basePayload, secret)
        assertFalse(TapMoMoSigner.verify(signed, "other-secret"))
    }

    @Test
    fun `ttl validation fails for expired payload`() {
        val now = Instant.fromEpochMilliseconds(basePayload.ts + TapMoMoValidator.DEFAULT_TTL_MS + 1)
        assertFalse(TapMoMoValidator.isTimestampWithinTtl(basePayload.ts, now = now))
    }

    @Test
    fun `nonce replay is detected`() {
        val store = NonceMemoryStore(ttlMillis = 10_000)
        val first = store.checkAndStore("nonce-1", basePayload.ts, basePayload.ts)
        val second = store.checkAndStore("nonce-1", basePayload.ts + 500, basePayload.ts + 500)
        assertTrue(first)
        assertFalse(second)
    }

    @Test
    fun `schema parsing rejects missing required field`() {
        val invalidJson = """{"ver":1,"merchantId":"m","currency":"NGN","ts":1,"nonce":"n"}"""
        assertFailsWith<Exception> {
            TapMoMoJson.decode(invalidJson)
        }
    }
}
