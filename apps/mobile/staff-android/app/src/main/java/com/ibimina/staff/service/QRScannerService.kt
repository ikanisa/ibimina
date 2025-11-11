package com.ibimina.staff.service

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class QRScannerService : Service() {

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "QRScannerService invoked. Preparing camera session")
        // TODO: Wire QR scanner camera flow and deliver decoded payloads.
        stopSelf(startId)
        return START_NOT_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        private const val TAG = "QRScannerService"
    }
}
