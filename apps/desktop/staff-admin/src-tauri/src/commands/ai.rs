use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use tauri_plugin_store::StoreExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccessibilitySettings {
    pub high_contrast: bool,
    pub reduced_motion: bool,
    pub large_text: bool,
    pub text_scaling: f32,
    pub color_blind_mode: String,
    pub cursor_size: String,
    pub screen_reader: bool,
    pub sound_effects: bool,
    pub voice_feedback: bool,
    pub keyboard_navigation: bool,
    pub sticky_keys: bool,
    pub slow_keys: bool,
    pub slow_keys_delay: u32,
    pub focus_indicator: String,
    pub simplified_ui: bool,
    pub reading_guide: bool,
    pub dyslexia_font: bool,
    pub line_spacing: f32,
    pub word_spacing: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoiceCommand {
    pub id: String,
    pub transcript: String,
    pub command_matched: String,
    pub confidence: f32,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CachedScan {
    pub id: String,
    pub file_path: String,
    pub result: String,
    pub cached_at: String,
}

/// Get accessibility settings from persistent store
#[tauri::command]
pub async fn get_accessibility_settings(app: AppHandle) -> Result<Option<AccessibilitySettings>, String> {
    let store = app.store("accessibility.json")
        .map_err(|e| format!("Failed to access store: {}", e))?;

    let settings = store.get("accessibility_settings")
        .and_then(|v| serde_json::from_value::<AccessibilitySettings>(v.clone()).ok());

    Ok(settings)
}

/// Save accessibility settings to persistent store
#[tauri::command]
pub async fn save_accessibility_settings(
    app: AppHandle,
    settings: AccessibilitySettings
) -> Result<(), String> {
    let store = app.store("accessibility.json")
        .map_err(|e| format!("Failed to access store: {}", e))?;

    store.set("accessibility_settings", serde_json::to_value(&settings).unwrap());
    store.save()
        .map_err(|e| format!("Failed to save settings: {}", e))?;

    Ok(())
}

/// Get voice command history with optional limit
#[tauri::command]
pub async fn get_voice_command_history(
    app: AppHandle,
    limit: Option<u32>
) -> Result<Vec<VoiceCommand>, String> {
    let store = app.store("voice_commands.json")
        .map_err(|e| format!("Failed to access store: {}", e))?;

    let commands: Vec<VoiceCommand> = store.get("command_history")
        .and_then(|v| serde_json::from_value(v.clone()).ok())
        .unwrap_or_default();

    let limit = limit.unwrap_or(100) as usize;
    let result = commands.into_iter().rev().take(limit).collect();

    Ok(result)
}

/// Save a voice command to history
#[tauri::command]
pub async fn save_voice_command(
    app: AppHandle,
    command: VoiceCommand
) -> Result<(), String> {
    let store = app.store("voice_commands.json")
        .map_err(|e| format!("Failed to access store: {}", e))?;

    let mut commands: Vec<VoiceCommand> = store.get("command_history")
        .and_then(|v| serde_json::from_value(v.clone()).ok())
        .unwrap_or_default();

    commands.push(command);

    // Keep only last 1000 commands
    if commands.len() > 1000 {
        commands = commands.into_iter().rev().take(1000).rev().collect();
    }

    store.set("command_history", serde_json::to_value(&commands).unwrap());
    store.save()
        .map_err(|e| format!("Failed to save command: {}", e))?;

    Ok(())
}

/// Get a cached document scan by ID
#[tauri::command]
pub async fn get_document_scan_cache(
    app: AppHandle,
    scan_id: String
) -> Result<Option<CachedScan>, String> {
    let store = app.store("document_cache.json")
        .map_err(|e| format!("Failed to access store: {}", e))?;

    let cache: Vec<CachedScan> = store.get("scans")
        .and_then(|v| serde_json::from_value(v.clone()).ok())
        .unwrap_or_default();

    let result = cache.into_iter().find(|s| s.id == scan_id);

    Ok(result)
}

/// Save a document scan to cache
#[tauri::command]
pub async fn save_document_scan_cache(
    app: AppHandle,
    scan: CachedScan
) -> Result<(), String> {
    let store = app.store("document_cache.json")
        .map_err(|e| format!("Failed to access store: {}", e))?;

    let mut scans: Vec<CachedScan> = store.get("scans")
        .and_then(|v| serde_json::from_value(v.clone()).ok())
        .unwrap_or_default();

    // Remove old scan with same ID if exists
    scans.retain(|s| s.id != scan.id);
    scans.push(scan);

    // Keep only last 50 scans
    if scans.len() > 50 {
        scans = scans.into_iter().rev().take(50).rev().collect();
    }

    store.set("scans", serde_json::to_value(&scans).unwrap());
    store.save()
        .map_err(|e| format!("Failed to save scan: {}", e))?;

    Ok(())
}

/// Clear all document cache
#[tauri::command]
pub async fn clear_document_cache(app: AppHandle) -> Result<(), String> {
    let store = app.store("document_cache.json")
        .map_err(|e| format!("Failed to access store: {}", e))?;

    store.set("scans", serde_json::to_value::<Vec<CachedScan>>(vec![]).unwrap());
    store.save()
        .map_err(|e| format!("Failed to clear cache: {}", e))?;

    Ok(())
}

/// Clear voice command history
#[tauri::command]
pub async fn clear_voice_history(app: AppHandle) -> Result<(), String> {
    let store = app.store("voice_commands.json")
        .map_err(|e| format!("Failed to access store: {}", e))?;

    store.set("command_history", serde_json::to_value::<Vec<VoiceCommand>>(vec![]).unwrap());
    store.save()
        .map_err(|e| format!("Failed to clear history: {}", e))?;

    Ok(())
}
