// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod auth;
mod encryption;

use auth::{get_user_profile, login_api};
use encryption::{decrypt_json, encrypt_json, config_exists};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            encrypt_json,
            decrypt_json,
            login_api,
            get_user_profile,
            config_exists
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
