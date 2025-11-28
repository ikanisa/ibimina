use keyring::Entry;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

const SERVICE_NAME: &str = "rw.ibimina.staff-admin";
const CREDENTIALS_KEY: &str = "auth_credentials";
const DEVICE_ID_KEY: &str = "device_id";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SecureCredentials {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_at: i64,
}

/// Retrieve stored auth tokens from OS keychain
#[tauri::command]
pub async fn get_secure_credentials() -> Result<Option<SecureCredentials>, String> {
    let entry = Entry::new(SERVICE_NAME, CREDENTIALS_KEY)
        .map_err(|e| format!("Failed to access keychain: {}", e))?;

    match entry.get_password() {
        Ok(json_str) => {
            let credentials: SecureCredentials = serde_json::from_str(&json_str)
                .map_err(|e| format!("Failed to deserialize credentials: {}", e))?;
            Ok(Some(credentials))
        }
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(format!("Failed to retrieve credentials: {}", e)),
    }
}

/// Store auth tokens securely in OS keychain
#[tauri::command]
pub async fn set_secure_credentials(credentials: SecureCredentials) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, CREDENTIALS_KEY)
        .map_err(|e| format!("Failed to access keychain: {}", e))?;

    let json_str = serde_json::to_string(&credentials)
        .map_err(|e| format!("Failed to serialize credentials: {}", e))?;

    entry
        .set_password(&json_str)
        .map_err(|e| format!("Failed to store credentials: {}", e))?;

    Ok(())
}

/// Clear stored credentials from OS keychain
#[tauri::command]
pub async fn delete_secure_credentials() -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, CREDENTIALS_KEY)
        .map_err(|e| format!("Failed to access keychain: {}", e))?;

    match entry.delete_password() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()), // Already deleted
        Err(e) => Err(format!("Failed to delete credentials: {}", e)),
    }
}

/// Generate or retrieve unique device identifier
#[tauri::command]
pub async fn get_device_id() -> Result<String, String> {
    let entry = Entry::new(SERVICE_NAME, DEVICE_ID_KEY)
        .map_err(|e| format!("Failed to access keychain: {}", e))?;

    match entry.get_password() {
        Ok(device_id) => Ok(device_id),
        Err(keyring::Error::NoEntry) => {
            // Generate new device ID
            let device_id = Uuid::new_v4().to_string();
            entry
                .set_password(&device_id)
                .map_err(|e| format!("Failed to store device ID: {}", e))?;
            Ok(device_id)
        }
        Err(e) => Err(format!("Failed to retrieve device ID: {}", e)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_device_id_generation() {
        // Note: This test requires access to the system keychain
        // In CI, keychain access may not be available
        match get_device_id().await {
            Ok(device_id) => {
                assert!(!device_id.is_empty());
                // Verify it's a valid UUID format
                assert!(Uuid::parse_str(&device_id).is_ok());
            }
            Err(e) => {
                // Expected in CI environments without keychain access
                eprintln!("Keychain not available: {}", e);
            }
        }
    }
}
