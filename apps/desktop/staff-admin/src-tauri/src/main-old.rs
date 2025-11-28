// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use commands::{auth, hardware, print, updates};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Create system tray menu
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show_item = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            // Create tray icon
            let _tray = TrayIconBuilder::with_id("main-tray")
                .menu(&menu)
                .icon(app.default_window_icon().cloned().unwrap())
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

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
        .invoke_handler(tauri::generate_handler![
            // Auth commands
            auth::get_secure_credentials,
            auth::set_secure_credentials,
            auth::delete_secure_credentials,
            auth::get_device_id,
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
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::default().build())
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![
            commands::auth::get_secure_credentials,
            commands::auth::set_secure_credentials,
            commands::auth::delete_secure_credentials,
            commands::print::print_receipt,
            commands::print::get_printers,
            commands::hardware::start_barcode_scan,
            commands::updates::check_for_updates,
            commands::updates::install_update,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn main() {
    run();
}
