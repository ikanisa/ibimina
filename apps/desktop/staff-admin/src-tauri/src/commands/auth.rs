use keyring::Entry;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

const SERVICE_NAME: &str = "rw.ibimina.staff-admin";
const CREDENTIALS_KEY: &str = "auth_credentials";
const DEVICE_ID_KEY: &str = "device_id";

#[derive(Debug, Serialize, Deserialize)]
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
        let device_id = get_device_id().await.unwrap();
        assert!(!device_id.is_empty());
        
        // Second call should return same ID
        let device_id2 = get_device_id().await.unwrap();
        assert_eq!(device_id, device_id2);
    }
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Credentials {
    pub username: String,
    pub token: String,
}

/// Get secure credentials from the system keychain
#[tauri::command]
pub async fn get_secure_credentials(key: String) -> Result<Option<Credentials>, String> {
    // TODO: Implement secure credential retrieval
    // Use platform-specific secure storage (Windows Credential Manager, macOS Keychain, Linux Secret Service)
    Err("Not implemented".to_string())
}

/// Store secure credentials in the system keychain
#[tauri::command]
pub async fn set_secure_credentials(
    key: String,
    credentials: Credentials,
) -> Result<(), String> {
    // TODO: Implement secure credential storage
    Err("Not implemented".to_string())
}

/// Delete secure credentials from the system keychain
#[tauri::command]
pub async fn delete_secure_credentials(key: String) -> Result<(), String> {
    // TODO: Implement secure credential deletion
    Err("Not implemented".to_string())
}
