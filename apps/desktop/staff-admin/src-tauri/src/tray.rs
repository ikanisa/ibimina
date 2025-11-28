use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, Runtime,
};
use tokio::sync::oneshot;

/// Create and configure the system tray icon with menu
pub fn create_tray<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<()> {
    // Create menu items
    let show = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;
    let hide = MenuItem::with_id(app, "hide", "Hide Window", true, None::<&str>)?;
    let separator1 = PredefinedMenuItem::separator(app)?;
    
    // Quick actions submenu
    let new_payment = MenuItem::with_id(app, "new_payment", "Record Payment", true, Some("CmdOrCtrl+N"))?;
    let reconcile = MenuItem::with_id(app, "reconcile", "Start Reconciliation", true, Some("CmdOrCtrl+R"))?;
    let quick_actions = Submenu::with_items(
        app,
        "Quick Actions",
        true,
        &[&new_payment, &reconcile],
    )?;
    
    // Status and settings items
    let sync_now = MenuItem::with_id(app, "sync_now", "Sync Now", true, None::<&str>)?;
    let check_updates = MenuItem::with_id(app, "check_updates", "Check for Updates", true, None::<&str>)?;
    
    let separator2 = PredefinedMenuItem::separator(app)?;
    let preferences = MenuItem::with_id(app, "preferences", "Preferences...", true, Some("CmdOrCtrl+,"))?;
    let separator3 = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "Quit SACCO+ Admin", true, Some("CmdOrCtrl+Q"))?;

    // Build complete menu
    let menu = Menu::with_items(
        app,
        &[
            &show,
            &hide,
            &separator1,
            &quick_actions,
            &sync_now,
            &check_updates,
            &separator2,
            &preferences,
            &separator3,
            &quit,
        ],
    )?;

    // Create tray icon
    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .tooltip("SACCO+ Staff Admin")
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "hide" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                }
            }
            "new_payment" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.emit("navigate", "/payments/new");
                }
            }
            "reconcile" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.emit("navigate", "/recon/new");
                }
            }
            "sync_now" => {
                let _ = app.emit("sync-requested", ());
            }
            "check_updates" => {
                let _ = app.emit("check-updates", ());
            }
            "preferences" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.emit("navigate", "/settings");
                }
            }
            "quit" => {
                app.exit(0);
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

    Ok(())
}

#[derive(Clone, serde::Serialize)]
struct SyncResult {
    success: bool,
    changes: u32,
    timestamp: String,
}

/// Background sync task with graceful shutdown support
pub async fn start_background_sync(
    app_handle: tauri::AppHandle,
    mut shutdown_rx: oneshot::Receiver<()>,
) {
    use tokio::time::{interval, Duration};
    
    let mut sync_interval = interval(Duration::from_secs(300)); // 5 minutes
    
    loop {
        tokio::select! {
            _ = sync_interval.tick() => {
                // Check if online
                if !is_online().await {
                    continue;
                }
                
                // Perform background sync
                match perform_sync(&app_handle).await {
                    Ok(changes) => {
                        if changes > 0 {
                            // Notify frontend of changes
                            let _ = app_handle.emit("sync-completed", SyncResult {
                                success: true,
                                changes,
                                timestamp: chrono::Utc::now().to_rfc3339(),
                            });
                            
                            // Update tray icon badge (macOS only)
                            #[cfg(target_os = "macos")]
                            update_dock_badge(&app_handle, changes);
                        }
                    }
                    Err(e) => {
                        eprintln!("Background sync failed: {}", e);
                        let _ = app_handle.emit("sync-error", e.to_string());
                    }
                }
            }
            _ = &mut shutdown_rx => {
                println!("Shutting down background sync gracefully...");
                break;
            }
        }
    }
}

/// Simple connectivity check
async fn is_online() -> bool {
    match reqwest::get("https://api.ibimina.rw/health").await {
        Ok(response) => response.status().is_success(),
        Err(_) => false,
    }
}

/// Perform sync operation with Supabase
async fn perform_sync(app_handle: &tauri::AppHandle) -> Result<u32, Box<dyn std::error::Error>> {
    // This would integrate with the offline sync engine
    // For now, return 0 to indicate no changes
    // In production, this would:
    // 1. Fetch pending changes from local store
    // 2. Push to Supabase
    // 3. Pull changes from Supabase
    // 4. Resolve conflicts
    // 5. Update local store
    Ok(0)
}

/// Update macOS dock badge with unread count
#[cfg(target_os = "macos")]
fn update_dock_badge(app_handle: &tauri::AppHandle, count: u32) {
    use cocoa::appkit::NSApp;
    use cocoa::base::nil;
    use cocoa::foundation::NSString;
    use objc::{msg_send, sel, sel_impl};
    
    unsafe {
        let label = if count > 0 {
            NSString::alloc(nil).init_str(&count.to_string())
        } else {
            NSString::alloc(nil).init_str("")
        };
        let dock_tile: cocoa::base::id = msg_send![NSApp(), dockTile];
        let _: () = msg_send![dock_tile, setBadgeLabel: label];
    }
}

/// Fallback for non-macOS platforms
#[cfg(not(target_os = "macos"))]
fn update_dock_badge(_app_handle: &tauri::AppHandle, _count: u32) {
    // No-op on non-macOS platforms
}
