#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{AppHandle, Manager, WebviewWindow};
use tauri_plugin_clipboard_manager::ClipboardExt;

#[tauri::command]
async fn get_focused_text(app: AppHandle) -> String {
    match app.clipboard().read_text().await {
        Ok(text) => text,
        Err(_) => String::from(""),
    }
}

#[tauri::command]
async fn inject_processed_text(app: AppHandle, text: String) -> Result<(), String> {
    app.clipboard()
        .write_text(text)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_overlay(window: WebviewWindow) {
    if window.is_visible().unwrap_or(false) {
        let _ = window.hide();
    } else {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            get_focused_text,
            inject_processed_text,
            toggle_overlay
        ])
        .run(tauri::generate_context!())
        .expect("Fatal: failed to start ZenLink runtime");
}
