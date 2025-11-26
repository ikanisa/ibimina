#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

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
