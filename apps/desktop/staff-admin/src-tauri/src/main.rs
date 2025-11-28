// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod tray;

use commands::{auth, crypto, hardware, print, updates};
use tauri::{Emitter, Manager};
use tokio::sync::oneshot;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Create system tray with full menu
            tray::create_tray(app.handle())?;

            // Start background sync task
            let app_handle = app.handle().clone();
            let (shutdown_tx, shutdown_rx) = oneshot::channel();
            
            // Store shutdown sender for graceful shutdown
            app.manage(shutdown_tx);
            
            tauri::async_runtime::spawn(async move {
                tray::start_background_sync(app_handle, shutdown_rx).await;
            });

            // Check for updates on startup
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                // Wait a bit before checking
                tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;

                match updates::check_for_updates(app_handle.clone()).await {
                    Ok(update_info) => {
                        if update_info.update_available {
                            // Emit update-available event to frontend
                            if let Some(window) = app_handle.get_webview_window("main") {
                                let _ = window.emit("update-available", update_info);
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("Failed to check for updates: {}", e);
                    }
                }
            });

            Ok(())
        })
        .manage(hardware::ScannerState::default())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::default().build())
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![
            // Auth commands
            auth::get_secure_credentials,
            auth::set_secure_credentials,
            auth::delete_secure_credentials,
            auth::get_device_id,
            // Crypto commands
            crypto::encrypt_data,
            crypto::decrypt_data,
            // Print commands
            print::get_printers,
            print::print_html,
            print::print_receipt,
            // Hardware commands
            hardware::is_scanner_available,
            hardware::start_barcode_scan,
            hardware::stop_barcode_scan,
            hardware::is_nfc_available,
            hardware::start_nfc_reading,
            hardware::stop_nfc_reading,
            hardware::is_biometrics_available,
            hardware::authenticate_biometrics,
            // Update commands
            updates::check_for_updates,
            updates::download_update,
            updates::install_update,
            updates::get_current_version,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn main() {
    run();
}
