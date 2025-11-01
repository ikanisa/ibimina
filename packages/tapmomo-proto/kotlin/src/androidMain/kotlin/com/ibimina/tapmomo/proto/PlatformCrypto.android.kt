package com.ibimina.tapmomo.proto

import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

actual fun platformHmacSha256(message: ByteArray, secret: ByteArray): ByteArray {
    val mac = Mac.getInstance("HmacSHA256")
    val keySpec = SecretKeySpec(secret, "HmacSHA256")
    mac.init(keySpec)
    return mac.doFinal(message)
}
