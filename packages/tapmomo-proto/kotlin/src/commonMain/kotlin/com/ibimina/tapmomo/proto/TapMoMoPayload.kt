package com.ibimina.tapmomo.proto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json

/**
 * JSON schema for the TapMoMo payload. The schema is duplicated across
 * the Kotlin, Swift and TypeScript implementations so the payload shape
 * stays in sync across platforms.
 */
const val TAPMOMO_PAYLOAD_SCHEMA_JSON: String = """
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://schemas.ibimina.com/tapmomo/payload.json",
  "title": "TapMoMoPayload",
  "type": "object",
  "required": ["ver", "network", "merchantId", "currency", "ts", "nonce"],
  "properties": {
    "ver": { "type": "integer", "enum": [1] },
    "network": { "type": "string", "minLength": 1 },
    "merchantId": { "type": "string", "minLength": 1 },
    "currency": { "type": "string", "minLength": 1 },
    "amount": { "type": "integer", "minimum": 0 },
    "ref": { "type": "string", "minLength": 1 },
    "ts": { "type": "integer", "minimum": 0 },
    "nonce": { "type": "string", "minLength": 1 },
    "sig": { "type": "string", "minLength": 44 }
  },
  "additionalProperties": false
}
"""

/**
 * Strongly-typed representation of the TapMoMo payload used for NFC and
 * Supabase integrations.
 */
@Serializable
data class TapMoMoPayload(
    val ver: Int = 1,
    val network: String,
    val merchantId: String,
    val currency: String,
    val amount: Int? = null,
    val ref: String? = null,
    val ts: Long,
    val nonce: String,
    @SerialName("sig") val signature: String? = null,
)

/**
 * Thin wrapper around kotlinx.serialization to keep JSON formatting in
 * one place for all platforms.
 */
object TapMoMoJson {
    private val json = Json {
        ignoreUnknownKeys = false
        explicitNulls = false
        encodeDefaults = true
    }

    fun encode(payload: TapMoMoPayload): String =
        json.encodeToString(TapMoMoPayload.serializer(), payload)

    @Throws(SerializationException::class)
    fun decode(raw: String): TapMoMoPayload =
        json.decodeFromString(TapMoMoPayload.serializer(), raw)
}
