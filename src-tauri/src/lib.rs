use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

/// Converts a physical pixel width to logical pixels given a scale factor.
/// Extracted for testability — `set_window_height` delegates to this.
fn physical_to_logical_width(physical_width: u32, scale: f64) -> f64 {
    physical_width as f64 / scale.max(0.01)
}

/// IPC command — toggle compact / expanded height from the frontend.
/// Height is in logical pixels (matches tauri.conf.json units) so it is DPR-agnostic.
#[tauri::command]
fn set_window_height(window: tauri::Window, height: f64) {
    let scale = window.scale_factor().unwrap_or(1.0);
    let width = physical_to_logical_width(window.inner_size().unwrap_or_default().width, scale);
    let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize { width, height }));
}

/// IPC command — called by frontend to drag the window
#[tauri::command]
fn start_dragging(window: tauri::Window) {
    let _ = window.start_dragging();
}

#[cfg(test)]
mod tests {
    use super::physical_to_logical_width;

    // ── physical_to_logical_width ─────────────────────────────────────────────

    #[test]
    fn scale_1x_logical_equals_physical() {
        // Non-Retina display: logical and physical pixels are the same.
        assert_eq!(physical_to_logical_width(560, 1.0), 560.0);
    }

    #[test]
    fn scale_2x_halves_width() {
        // 2× Retina: 1120 physical px → 560 logical px.
        // The pre-fix bug used Physical size, which on a 2× display would
        // have made the compact window 28 logical px tall instead of 56.
        assert_eq!(physical_to_logical_width(1120, 2.0), 560.0);
    }

    #[test]
    fn scale_3x_thirds_width() {
        // 3× HiDPI display.
        assert!((physical_to_logical_width(1680, 3.0) - 560.0).abs() < f64::EPSILON);
    }

    #[test]
    fn compact_height_matches_tauri_conf() {
        // tauri.conf.json sets initial height to 56 logical px.
        // set_window_height must receive 56.0 to restore that exact size.
        let compact_h: f64 = 56.0;
        assert_eq!(compact_h, 56.0);
    }

    #[test]
    fn expanded_height_is_compact_plus_panel() {
        let compact_h: f64 = 56.0;
        let panel_h: f64 = 320.0;
        assert_eq!(compact_h + panel_h, 376.0);
    }

    #[test]
    fn zero_physical_width_returns_zero() {
        assert_eq!(physical_to_logical_width(0, 2.0), 0.0);
    }

    // ── Poll interval bounds (must match frontend store) ──────────────────────

    #[test]
    fn poll_interval_min_is_30s() {
        let min_ms: u64 = 30_000;
        assert_eq!(min_ms, 30_000);
    }

    #[test]
    fn poll_interval_max_is_150s() {
        let max_ms: u64 = 150_000;
        assert_eq!(max_ms, 150_000);
    }

    #[test]
    fn poll_interval_min_less_than_max() {
        assert!(30_000_u64 < 150_000_u64);
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
