// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod auth;
mod encryption;
mod service;

use auth::{get_user_profile, login_api};
use encryption::{config_exists, decrypt_json, encrypt_json};
use service::{check_service_status, start_service, echo_test}; // Added echo_test
use serde_json::json;
use std::process;
use tauri::{Emitter, Manager, WindowEvent};

// Add the #[tauri::command] attribute to mark it as a Tauri command
#[tauri::command]
fn force_exit() {
    // Force exit with success status code
    process::exit(0);
}

fn main() {
    println!("Starting application");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            encrypt_json,
            decrypt_json,
            login_api,
            get_user_profile,
            config_exists,
            force_exit,
            check_service_status,
            start_service,
            echo_test, // Added echo_test command
        ])
        .setup(|app| {
            println!("Setup phase...");
            
            // Get the main window
            let main_window = app.get_webview_window("main").unwrap();

            // Create a clone of the window to use in the closure
            let window_clone = main_window.clone();

            // Set up the window event listener
            main_window.on_window_event(move |event| {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    // Prevent the default close behavior
                    api.prevent_close();

                    // Use the cloned window to emit the event with a proper payload
                    let _ = window_clone
                        .emit("tauri://close-requested", json!({"reason": "user_close"}));
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}