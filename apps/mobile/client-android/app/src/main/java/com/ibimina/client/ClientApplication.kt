package com.ibimina.client

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

/**
 * Application class for Ibimina Client App
 * 
 * Required for Hilt dependency injection
 */
@HiltAndroidApp
class ClientApplication : Application()
