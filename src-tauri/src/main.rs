// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod encryption;

use encryption::encrypt_json;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![encrypt_json])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
