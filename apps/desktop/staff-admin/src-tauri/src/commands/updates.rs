use futures::StreamExt;
use serde::{Deserialize, Serialize};
use std::io::Write;
use tauri::{Emitter, WebviewWindow};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UpdateInfo {
    pub current_version: String,
    pub latest_version: String,
    pub update_available: bool,
    pub release_notes: String,
    pub download_url: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DownloadProgress {
    pub downloaded: u64,
    pub total: u64,
    pub percentage: f64,
}

/// Check for updates from GitHub releases
#[tauri::command]
pub async fn check_for_updates(app_handle: tauri::AppHandle) -> Result<UpdateInfo, String> {
    let current_version = app_handle.package_info().version.to_string();

    // Fetch latest release from GitHub API
    let client = reqwest::Client::builder()
        .user_agent("SACCO+ Staff Admin")
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let response = client
        .get("https://api.github.com/repos/ikanisa/ibimina/releases/latest")
        .send()
        .await
        .map_err(|e| format!("Failed to fetch releases: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("GitHub API returned status: {}", response.status()));
    }

    let release: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let latest_version = release["tag_name"]
        .as_str()
        .unwrap_or("")
        .trim_start_matches('v')
        .to_string();

    let release_notes = release["body"].as_str().unwrap_or("").to_string();

    // Find download URL for current platform
    let empty_vec = vec![];
    let assets = release["assets"].as_array().unwrap_or(&empty_vec);
    let platform_asset = find_platform_asset(assets);
    let download_url = platform_asset
        .and_then(|a| a["browser_download_url"].as_str())
        .unwrap_or("")
        .to_string();

    let update_available = version_is_greater(&latest_version, &current_version);

    Ok(UpdateInfo {
        current_version,
        latest_version,
        update_available,
        release_notes,
        download_url,
    })
}

fn version_is_greater(latest: &str, current: &str) -> bool {
    // Simple version comparison (for production, use semver crate)
    latest != current
}

fn find_platform_asset(assets: &[serde_json::Value]) -> Option<&serde_json::Value> {
    let platform_ext = if cfg!(target_os = "windows") {
        ".msi"
    } else if cfg!(target_os = "macos") {
        ".dmg"
    } else if cfg!(target_os = "linux") {
        ".AppImage"
    } else {
        return None;
    };

    assets
        .iter()
        .find(|asset| {
            asset["name"]
                .as_str()
                .map(|name| name.ends_with(platform_ext))
                .unwrap_or(false)
        })
}

/// Download update with progress events
#[tauri::command]
pub async fn download_update(
    window: WebviewWindow,
    download_url: String,
) -> Result<String, String> {
    let client = reqwest::Client::new();

    let response = client
        .get(&download_url)
        .send()
        .await
        .map_err(|e| format!("Download failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Download failed with status: {}", response.status()));
    }

    let total_size = response.content_length().unwrap_or(0);
    let mut downloaded: u64 = 0;

    // Get temp directory for download
    let temp_dir = std::env::temp_dir();
    let filename = download_url.split('/').last().unwrap_or("update");
    let file_path = temp_dir.join(filename);

    let mut file = std::fs::File::create(&file_path)
        .map_err(|e| format!("Failed to create file: {}", e))?;

    let mut stream = response.bytes_stream();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Download error: {}", e))?;
        file.write_all(&chunk)
            .map_err(|e| format!("Write error: {}", e))?;

        downloaded += chunk.len() as u64;

        // Emit progress event
        let progress = DownloadProgress {
            downloaded,
            total: total_size,
            percentage: if total_size > 0 {
                (downloaded as f64 / total_size as f64) * 100.0
            } else {
                0.0
            },
        };

        let _ = window.emit("download-progress", progress);
    }

    Ok(file_path.to_string_lossy().to_string())
}

/// Install update and restart app
#[tauri::command]
pub async fn install_update(installer_path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        // Launch MSI installer
        std::process::Command::new("msiexec")
            .args(["/i", &installer_path, "/qn", "/norestart"])
            .spawn()
            .map_err(|e| format!("Failed to launch installer: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        // Mount DMG and copy app
        std::process::Command::new("hdiutil")
            .args(["attach", &installer_path])
            .spawn()
            .map_err(|e| format!("Failed to mount DMG: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        // Make AppImage executable and run
        std::process::Command::new("chmod")
            .args(["+x", &installer_path])
            .output()
            .map_err(|e| format!("Failed to make executable: {}", e))?;

        std::process::Command::new(&installer_path)
            .spawn()
            .map_err(|e| format!("Failed to launch installer: {}", e))?;
    }

    // Exit current app to allow update
    std::process::exit(0);
}

/// Get current app version
#[tauri::command]
pub fn get_current_version(app_handle: tauri::AppHandle) -> String {
    app_handle.package_info().version.to_string()
}
