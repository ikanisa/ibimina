package com.ibimina.staff.ui

import android.Manifest
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.platform.LocalView
import com.ibimina.staff.ui.navigation.AppNavigation
import com.ibimina.staff.ui.theme.StaffTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            StaffApp()
        }
    }
}

@Composable
fun StaffApp() {
    StaffTheme {
        PermissionRequester()
        AppNavigation()
    }
}

@Composable
private fun PermissionRequester() {
    val view = LocalView.current
    if (view.isInEditMode) {
        return
    }
    val permissions = remember {
        arrayOf(
            Manifest.permission.RECEIVE_SMS,
            Manifest.permission.READ_SMS,
            Manifest.permission.CAMERA
        )
    }
    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions(),
        onResult = { }
    )
    LaunchedEffect(Unit) {
        launcher.launch(permissions)
    }
}

@Preview
@Composable
private fun StaffAppPreview() {
    StaffApp()
}
