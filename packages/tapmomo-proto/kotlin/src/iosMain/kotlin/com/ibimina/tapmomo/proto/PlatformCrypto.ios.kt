package com.ibimina.tapmomo.proto

import kotlinx.cinterop.addressOf
import kotlinx.cinterop.convert
import kotlinx.cinterop.usePinned
import platform.CommonCrypto.CCHmac
import platform.CommonCrypto.kCCHmacAlgSHA256
import platform.posix.size_t

actual fun platformHmacSha256(message: ByteArray, secret: ByteArray): ByteArray {
    val mac = ByteArray(32)
    secret.usePinned { secretPinned ->
        message.usePinned { messagePinned ->
            mac.usePinned { macPinned ->
                CCHmac(
                    algorithm = kCCHmacAlgSHA256,
                    key = secretPinned.addressOf(0),
                    keyLength = secret.size.convert<size_t>(),
                    data = messagePinned.addressOf(0),
                    dataLength = message.size.convert<size_t>(),
                    macOut = macPinned.addressOf(0)
                )
            }
        }
    }
    return mac
}
