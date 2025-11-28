// Encryption/Decryption commands for offline sync

use serde::{Deserialize, Serialize};
use base64::{Engine as _, engine::general_purpose};

#[derive(Debug, Serialize, Deserialize)]
pub struct EncryptRequest {
    pub data: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DecryptRequest {
    pub data: String,
}

/// Encrypt data using simple XOR cipher with rotating key
/// In production, use a proper encryption library like ring or sodiumoxide
#[tauri::command]
pub async fn encrypt_data(data: EncryptRequest) -> Result<String, String> {
    // Simple XOR encryption for demonstration
    // In production, use AES-256-GCM or similar
    let key = get_encryption_key().await?;
    let encrypted = xor_encrypt(data.data.as_bytes(), &key);
    Ok(general_purpose::STANDARD.encode(encrypted))
}

/// Decrypt data
#[tauri::command]
pub async fn decrypt_data(data: DecryptRequest) -> Result<String, String> {
    let key = get_encryption_key().await?;
    let encrypted = general_purpose::STANDARD
        .decode(data.data)
        .map_err(|e| format!("Base64 decode error: {}", e))?;
    
    let decrypted = xor_encrypt(&encrypted, &key);
    String::from_utf8(decrypted)
        .map_err(|e| format!("UTF-8 decode error: {}", e))
}

/// Get or generate encryption key from keyring
async fn get_encryption_key() -> Result<Vec<u8>, String> {
    use keyring::Entry;
    
    let entry = Entry::new("ibimina-staff-admin", "encryption-key")
        .map_err(|e| format!("Keyring error: {}", e))?;
    
    match entry.get_password() {
        Ok(password) => Ok(password.into_bytes()),
        Err(_) => {
            // Generate new key
            let key = generate_random_key(32);
            let key_str = general_purpose::STANDARD.encode(&key);
            entry.set_password(&key_str)
                .map_err(|e| format!("Failed to save key: {}", e))?;
            Ok(key)
        }
    }
}

/// Generate random encryption key
fn generate_random_key(length: usize) -> Vec<u8> {
    use uuid::Uuid;
    
    let mut key = Vec::with_capacity(length);
    while key.len() < length {
        let uuid = Uuid::new_v4();
        key.extend_from_slice(uuid.as_bytes());
    }
    key.truncate(length);
    key
}

/// Simple XOR encryption (for demonstration only)
fn xor_encrypt(data: &[u8], key: &[u8]) -> Vec<u8> {
    data.iter()
        .enumerate()
        .map(|(i, &byte)| byte ^ key[i % key.len()])
        .collect()
}
