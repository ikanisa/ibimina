package com.ibimina.staff.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Primary colors for Ibimina Staff app
private val md_theme_light_primary = Color(0xFF0066FF)
private val md_theme_light_onPrimary = Color(0xFFFFFFFF)
private val md_theme_light_secondary = Color(0xFF006B54)
private val md_theme_light_onSecondary = Color(0xFFFFFFFF)

private val md_theme_dark_primary = Color(0xFF5DB1FF)
private val md_theme_dark_onPrimary = Color(0xFF00315C)
private val md_theme_dark_secondary = Color(0xFF4FDAB7)
private val md_theme_dark_onSecondary = Color(0xFF00382A)

private val LightColors = lightColorScheme(
    primary = md_theme_light_primary,
    onPrimary = md_theme_light_onPrimary,
    secondary = md_theme_light_secondary,
    onSecondary = md_theme_light_onSecondary,
)

private val DarkColors = darkColorScheme(
    primary = md_theme_dark_primary,
    onPrimary = md_theme_dark_onPrimary,
    secondary = md_theme_dark_secondary,
    onSecondary = md_theme_dark_onSecondary,
)

@Composable
fun IbiminaStaffTheme(
    darkTheme: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColors else LightColors

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
