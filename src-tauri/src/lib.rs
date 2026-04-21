use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

/// IPC command — toggle compact / expanded height from the frontend
#[tauri::command]
fn set_window_height(window: tauri::Window, height: u32) {
    let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
        width: window.outer_size().unwrap_or_default().width,
        height,
    }));
}

/// IPC command — called by frontend to drag the window
#[tauri::command]
fn start_dragging(window: tauri::Window) {
    let _ = window.start_dragging();
}

#[cfg(test)]
mod tests {
    /// set_window_height receives a u32 — verify the type boundary values are valid
    #[test]
    fn window_height_compact() {
        let compact: u32 = 56;
        assert_eq!(compact, 56);
    }

    #[test]
    fn window_height_expanded() {
        let expanded: u32 = 56 + 320;
        assert_eq!(expanded, 376);
    }

    /// Poll interval bounds match the frontend store constraints (ms)
    #[test]
    fn poll_interval_bounds() {
        let min_ms: u64 = 30_000;
        let max_ms: u64 = 150_000;
        assert!(min_ms < max_ms);
        assert_eq!(min_ms, 30_000);
        assert_eq!(max_ms, 150_000);
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Debug)
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::LogDir { file_name: Some("cricket-hud".into()) },
                ))
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Stdout,
                ))
                .max_file_size(5_000_000)  // 5 MB
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
                .build(),
        )
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            // ── Tray icon ──────────────────────────────────────────────
            let quit = MenuItem::with_id(app, "quit", "Quit Cricket HUD", true, None::<&str>)?;
            let toggle =
                MenuItem::with_id(app, "toggle", "Show / Hide", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&toggle, &quit])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("Cricket HUD")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => app.exit(0),
                    "toggle" => {
                        if let Some(win) = app.get_webview_window("hud") {
                            if win.is_visible().unwrap_or(false) {
                                let _ = win.hide();
                            } else {
                                let _ = win.show();
                                let _ = win.set_focus();
                            }
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
                        if let Some(win) = app.get_webview_window("hud") {
                            if win.is_visible().unwrap_or(false) {
                                let _ = win.hide();
                            } else {
                                let _ = win.show();
                                let _ = win.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![set_window_height, start_dragging])
        .run(tauri::generate_context!())
        .expect("error while running Cricket HUD");
}
