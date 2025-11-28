use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tauri::{Emitter, WebviewWindow};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScanResult {
    pub data: String,
    pub scan_type: String,
    pub timestamp: i64,
}

#[derive(Clone)]
pub struct ScannerState {
    pub is_scanning: Arc<Mutex<bool>>,
}

impl Default for ScannerState {
    fn default() -> Self {
        Self {
            is_scanning: Arc::new(Mutex::new(false)),
        }
    }
}

/// Check if HID barcode scanner is available
#[tauri::command]
pub async fn is_scanner_available() -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        // Check for HID devices on Windows
        Ok(true) // Simplified - in production, enumerate HID devices
    }

    #[cfg(target_os = "macos")]
    {
        // Check IOKit for HID devices
        Ok(true) // Simplified
    }

    #[cfg(target_os = "linux")]
    {
        // Check /dev/input for HID devices
        use std::path::Path;
        Ok(Path::new("/dev/input").exists())
    }
}

/// Start listening for barcode scans
#[tauri::command]
pub async fn start_barcode_scan(
    window: WebviewWindow,
    state: tauri::State<'_, ScannerState>,
) -> Result<(), String> {
    let mut is_scanning = state
        .is_scanning
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    if *is_scanning {
        return Err("Scanner already active".to_string());
    }

    *is_scanning = true;
    drop(is_scanning);

    // Spawn background task to monitor HID input
    let is_scanning_clone = state.is_scanning.clone();
    tokio::spawn(async move {
        // Simplified scanner simulation
        // In production, this would use platform-specific HID APIs
        // to listen for scanner input events
        
        // Example: emit scan event when barcode is detected
        let _result = window.emit(
            "barcode-scanned",
            ScanResult {
                data: "EXAMPLE-BARCODE-123".to_string(),
                scan_type: "CODE128".to_string(),
                timestamp: chrono::Utc::now().timestamp(),
            },
        );

        // Reset scanning state when done
        if let Ok(mut is_scanning) = is_scanning_clone.lock() {
            *is_scanning = false;
        }
    });

    Ok(())
}

/// Stop barcode scanning
#[tauri::command]
pub async fn stop_barcode_scan(state: tauri::State<'_, ScannerState>) -> Result<(), String> {
    let mut is_scanning = state
        .is_scanning
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    *is_scanning = false;
    Ok(())
}

/// Check if NFC reader is available
#[tauri::command]
pub async fn is_nfc_available() -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        // Check for NFC readers via Windows.Devices.SmartCards
        Ok(false) // Simplified - requires Windows API calls
    }

    #[cfg(target_os = "macos")]
    {
        // macOS doesn't typically have built-in NFC readers
        Ok(false)
    }

    #[cfg(target_os = "linux")]
    {
        // Check for libnfc or pcscd
        use std::process::Command;
        let output = Command::new("which")
            .arg("pcscd")
            .output()
            .ok();
        
        Ok(output.map(|o| o.status.success()).unwrap_or(false))
    }
}

/// Start NFC reading
#[tauri::command]
pub async fn start_nfc_reading(window: WebviewWindow) -> Result<(), String> {
    // Emit event when NFC tag is detected
    // This is a simplified implementation
    let _result = window.emit(
        "nfc-detected",
        serde_json::json!({
            "uid": "04:12:34:56:78:90:AB",
            "type": "MIFARE_CLASSIC",
            "data": ""
        }),
    );

    Ok(())
}

/// Stop NFC reading
#[tauri::command]
pub async fn stop_nfc_reading() -> Result<(), String> {
    // Stop NFC reader
    Ok(())
}

/// Check if biometric authentication is available
#[tauri::command]
pub async fn is_biometrics_available() -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        // Check for Windows Hello
        check_windows_hello()
    }

    #[cfg(target_os = "macos")]
    {
        // Check for Touch ID
        check_touch_id()
    }

    #[cfg(target_os = "linux")]
    {
        // Linux typically doesn't have built-in biometrics
        Ok(false)
    }
}

#[cfg(target_os = "windows")]
fn check_windows_hello() -> Result<bool, String> {
    // Simplified - in production, check Windows.Security.Credentials.UI
    Ok(true)
}

#[cfg(target_os = "macos")]
fn check_touch_id() -> Result<bool, String> {
    // Simplified - in production, check LocalAuthentication framework
    Ok(true)
}

/// Trigger biometric authentication
#[tauri::command]
pub async fn authenticate_biometrics(reason: String) -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        authenticate_windows_hello(reason)
    }

    #[cfg(target_os = "macos")]
    {
        authenticate_touch_id(reason)
    }

    #[cfg(target_os = "linux")]
    {
        let _ = reason; // Suppress unused warning
        Err("Biometric authentication not supported on Linux".to_string())
    }
}

#[cfg(target_os = "windows")]
fn authenticate_windows_hello(_reason: String) -> Result<bool, String> {
    // Simplified implementation
    // In production, use Windows.Security.Credentials.UI.UserConsentVerifier
    Ok(true)
}

#[cfg(target_os = "macos")]
fn authenticate_touch_id(_reason: String) -> Result<bool, String> {
    // Simplified implementation
    // In production, use LocalAuthentication framework via objc bindings
    Ok(true)
}
