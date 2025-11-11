package rw.gov.ikanisa.ibimina.client.nfc

import android.app.Activity
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.nfc.tech.IsoDep
import android.nfc.tech.Ndef
import android.nfc.tech.NdefFormatable
import android.nfc.NdefMessage
import android.nfc.NdefRecord
import android.os.Bundle
import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import org.json.JSONObject
import java.io.IOException
import java.net.URI

@CapacitorPlugin(
    name = "NfcReader",
    permissions = [Permission(strings = ["android.permission.NFC"], alias = "nfc")]
)
class NfcReaderPlugin : Plugin() {

    private var nfcAdapter: NfcAdapter? = null
    private var readerModeCallback: NfcAdapter.ReaderCallback? = null
    private var currentCall: PluginCall? = null

    override fun load() {
        super.load()
        nfcAdapter = NfcAdapter.getDefaultAdapter(activity)
    }

    @PluginMethod
    fun isAvailable(call: PluginCall) {
        val result = JSObject()
        result.put("available", nfcAdapter != null && nfcAdapter?.isEnabled == true)
        call.resolve(result)
    }

    @PluginMethod
    fun isEnabled(call: PluginCall) {
        val result = JSObject()
        result.put("enabled", nfcAdapter?.isEnabled == true)
        call.resolve(result)
    }

    /**
     * Start NFC reader mode for tap-to-pay.
     * Reads both NDEF URI records and IsoDep HCE payloads.
     */
    @PluginMethod
    fun startReaderMode(call: PluginCall) {
        if (nfcAdapter == null) {
            call.reject("NFC not available on this device")
            return
        }

        if (nfcAdapter?.isEnabled != true) {
            call.reject("NFC is disabled. Please enable NFC in settings.")
            return
        }

        currentCall = call

        readerModeCallback = NfcAdapter.ReaderCallback { tag ->
            try {
                val result = readTag(tag)
                notifyListeners("nfcTagDetected", result)
                
                // Keep call open for multiple reads unless explicitly stopped
                // User can call stopReaderMode() when done
            } catch (e: Exception) {
                Log.e(TAG, "Error reading NFC tag", e)
                val errorResult = JSObject()
                errorResult.put("error", e.message ?: "Unknown error")
                notifyListeners("nfcReadError", errorResult)
            }
        }

        val flags = NfcAdapter.FLAG_READER_NFC_A or
                NfcAdapter.FLAG_READER_NFC_B or
                NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK

        nfcAdapter?.enableReaderMode(
            activity,
            readerModeCallback,
            flags,
            Bundle()
        )

        val response = JSObject()
        response.put("started", true)
        call.resolve(response)
    }

    @PluginMethod
    fun stopReaderMode(call: PluginCall) {
        nfcAdapter?.disableReaderMode(activity)
        readerModeCallback = null
        currentCall = null

        val result = JSObject()
        result.put("stopped", true)
        call.resolve(result)
    }

    /**
     * Read an NFC tag and return its payload.
     * Supports both NDEF URI records and IsoDep HCE.
     */
    private fun readTag(tag: Tag): JSObject {
        val result = JSObject()
        result.put("tagId", bytesToHex(tag.id))
        result.put("techList", tag.techList.toList())

        // Try NDEF first (standard tags and background reading)
        val ndefPayload = tryReadNdef(tag)
        if (ndefPayload != null) {
            result.put("type", "ndef")
            result.put("uri", ndefPayload)
            result.put("payload", parseUriPayload(ndefPayload))
            return result
        }

        // Try IsoDep for HCE emulation (TapMoMo payee device)
        val isoDepPayload = tryReadIsoDep(tag)
        if (isoDepPayload != null) {
            result.put("type", "isodep_hce")
            result.put("payload", isoDepPayload)
            return result
        }

        result.put("type", "unknown")
        result.put("error", "Unable to read tag payload")
        return result
    }

    /**
     * Try reading NDEF tag (standard NFC tags with URI records).
     */
    private fun tryReadNdef(tag: Tag): String? {
        val ndef = Ndef.get(tag) ?: return null

        try {
            ndef.connect()
            val ndefMessage = ndef.ndefMessage ?: return null

            for (record in ndefMessage.records) {
                if (record.tnf == NdefRecord.TNF_WELL_KNOWN &&
                    record.type.contentEquals(NdefRecord.RTD_URI)
                ) {
                    val uri = parseNdefUri(record.payload)
                    if (uri != null) {
                        return uri
                    }
                }
            }
        } catch (e: IOException) {
            Log.e(TAG, "Error reading NDEF tag", e)
        } finally {
            try {
                ndef.close()
            } catch (ignored: Exception) {
            }
        }

        return null
    }

    /**
     * Try reading IsoDep HCE payload (TapMoMo merchant device).
     */
    private fun tryReadIsoDep(tag: Tag): JSObject? {
        val isoDep = IsoDep.get(tag) ?: return null

        try {
            isoDep.connect()
            isoDep.timeout = 5000 // 5 second timeout

            // Send SELECT AID command
            val selectApdu = PayeeCardService.buildSelectApdu()
            val selectResponse = isoDep.transceive(selectApdu)

            if (!selectResponse.contentEquals(PayeeCardService.STATUS_SUCCESS)) {
                Log.w(TAG, "SELECT AID failed: ${bytesToHex(selectResponse)}")
                return null
            }

            // Send GET PAYLOAD command
            val getPayloadCmd = PayeeCardService.COMMAND_GET_PAYLOAD
            val payloadResponse = isoDep.transceive(getPayloadCmd)

            if (payloadResponse.size < 2) {
                Log.w(TAG, "Invalid APDU response length")
                return null
            }

            // Check status word (last 2 bytes)
            val statusWord = payloadResponse.takeLast(2).toByteArray()
            
            when {
                statusWord.contentEquals(PayeeCardService.STATUS_SUCCESS) -> {
                    val payloadBytes = payloadResponse.copyOfRange(0, payloadResponse.size - 2)
                    val payloadJson = String(payloadBytes, Charsets.UTF_8)
                    return parseHcePayload(payloadJson)
                }
                statusWord.contentEquals(PayeeCardService.STATUS_EXPIRED) -> {
                    val error = JSObject()
                    error.put("error", "expired")
                    error.put("message", "Payment request has expired")
                    return error
                }
                else -> {
                    val error = JSObject()
                    error.put("error", "invalid_status")
                    error.put("statusWord", bytesToHex(statusWord))
                    return error
                }
            }

        } catch (e: IOException) {
            Log.e(TAG, "Error reading IsoDep tag", e)
            return null
        } finally {
            try {
                isoDep.close()
            } catch (ignored: Exception) {
            }
        }
    }

    /**
     * Parse NDEF URI record payload.
     * First byte is URI identifier code, rest is the URI string.
     */
    private fun parseNdefUri(payload: ByteArray): String? {
        if (payload.isEmpty()) return null

        val uriIdentifier = payload[0].toInt() and 0xFF
        val uriBytes = payload.copyOfRange(1, payload.size)
        val uriSuffix = String(uriBytes, Charsets.UTF_8)

        val uriPrefix = when (uriIdentifier) {
            0x00 -> ""
            0x01 -> "http://www."
            0x02 -> "https://www."
            0x03 -> "http://"
            0x04 -> "https://"
            0x05 -> "tel:"
            0x06 -> "mailto:"
            else -> ""
        }

        return uriPrefix + uriSuffix
    }

    /**
     * Parse HCE payload JSON envelope.
     */
    private fun parseHcePayload(jsonString: String): JSObject {
        try {
            val envelope = JSONObject(jsonString)
            val result = JSObject()

            if (envelope.has("payload")) {
                val payload = envelope.getJSONObject("payload")
                result.put("network", payload.optString("network", ""))
                result.put("merchant_msisdn", payload.optString("merchant_msisdn", ""))
                result.put("merchant_code", payload.optString("merchant_code", ""))
                result.put("amount", payload.optLong("amount", 0))
                result.put("currency", payload.optString("currency", "RWF"))
                result.put("ref", payload.optString("ref", ""))
                result.put("nonce", payload.optString("nonce", ""))
                result.put("timestamp", payload.optLong("timestamp", 0))
            }

            if (envelope.has("signature")) {
                result.put("signature", envelope.getString("signature"))
            }

            if (envelope.has("expires_at")) {
                result.put("expires_at", envelope.getLong("expires_at"))
            }

            result.put("valid", true)
            return result

        } catch (e: Exception) {
            Log.e(TAG, "Error parsing HCE payload JSON", e)
            val error = JSObject()
            error.put("error", "parse_failed")
            error.put("message", e.message)
            error.put("valid", false)
            return error
        }
    }

    /**
     * Parse URI query parameters into JSObject.
     */
    private fun parseUriPayload(uriString: String): JSObject {
        val result = JSObject()
        
        try {
            val uri = URI(uriString)
            result.put("scheme", uri.scheme ?: "")
            result.put("host", uri.host ?: "")
            result.put("path", uri.path ?: "")

            val query = uri.query
            if (query != null) {
                val params = JSObject()
                query.split("&").forEach { param ->
                    val parts = param.split("=", limit = 2)
                    if (parts.size == 2) {
                        params.put(parts[0], parts[1])
                    }
                }
                result.put("params", params)
            }

            result.put("uri", uriString)
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing URI", e)
            result.put("uri", uriString)
            result.put("error", e.message)
        }

        return result
    }

    /**
     * Write NDEF URI record to a tag.
     */
    @PluginMethod
    fun writeNdefUri(call: PluginCall) {
        val uri = call.getString("uri")
        if (uri == null) {
            call.reject("Missing 'uri' parameter")
            return
        }

        // This would need to be triggered when a tag is detected
        // For now, we'll store the intent and notify when tag is detected
        call.reject("Write operation not yet implemented. Use Android Beam or tag writing apps.")
    }

    private fun bytesToHex(bytes: ByteArray): String {
        return bytes.joinToString("") { "%02X".format(it) }
    }

    companion object {
        private const val TAG = "NfcReaderPlugin"
    }
}
