use aes::cipher::{block_padding::Pkcs7, BlockEncryptMut, KeyIvInit};
use cipher::BlockDecryptMut;
use hex;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::process::Command;
use tauri::AppHandle;

// Define the AES-CBC cipher with PKCS7 padding
type Aes256CbcEnc = cbc::Encryptor<aes::Aes256>;
// Keep for potential future use
#[allow(dead_code)]
type Aes256CbcDec = cbc::Decryptor<aes::Aes256>;

#[derive(Debug, Serialize, Deserialize)]
pub struct EncryptionResult {
    success: bool,
    message: String,
    file_path: String,
}

// Command to encrypt JSON data
#[tauri::command]
pub async fn encrypt_json(
    _app_handle: AppHandle, // Prefixed with underscore to indicate intentionally unused
    json_data: String,
    output_path: Option<String>,
    char_key: Option<String>,
) -> Result<EncryptionResult, String> {
    // Parse char_key or use default "T"
    let char_key = char_key.unwrap_or_else(|| "T".to_string());
    let char_key = char_key.chars().next().unwrap_or('T');

    // Get computer info for key generation
    let computer_info = get_computer_info();
    println!("Computer info for key generation: {}", computer_info);

    // Generate key and IV
    let key = get_key(32, &computer_info, char_key);
    let iv = get_key(16, &computer_info, char_key);

    // Show key info for debugging
    let key_string = pad_with_char(&computer_info, 32, char_key);
    let iv_string = pad_with_char(&computer_info, 16, char_key);
    println!(
        "Full key string (with '{}' padding): {} (length: {})",
        char_key,
        key_string,
        key_string.len()
    );
    println!(
        "Full IV string (with '{}' padding): {} (length: {})",
        char_key,
        iv_string,
        iv_string.len()
    );
    println!("Generated key (hex): {:?}", hex::encode(&key));
    println!("Generated IV (hex): {:?}", hex::encode(&iv));

    // Encrypt the data
    let data_to_encrypt = json_data.as_bytes();
    let encrypted_data = match encrypt_data(data_to_encrypt, &key, &iv) {
        Ok(data) => data,
        Err(e) => return Err(format!("Encryption error: {}", e)),
    };

    println!("Encrypted data size: {} bytes", encrypted_data.len());

    // Determine output path
    let output_path = match output_path {
        Some(path) => {
            // Check if the path is absolute or just a filename
            let path_obj = Path::new(&path);
            if path_obj.is_absolute() {
                path
            } else {
                // If relative, use the downloads directory as the base
                match dirs::download_dir() {
                    Some(mut download_path) => {
                        download_path.push(path);
                        // Create directory if it doesn't exist
                        if let Some(parent) = download_path.parent() {
                            fs::create_dir_all(parent)
                                .map_err(|e| format!("Failed to create directory: {}", e))?;
                        }
                        download_path.to_string_lossy().to_string()
                    }
                    None => path, // Fallback to the provided path if downloads dir isn't available
                }
            }
        }
        None => {
            // Default path - use downloads directory
            match dirs::download_dir() {
                Some(mut path) => {
                    path.push("config");
                    path.to_string_lossy().to_string()
                }
                None => {
                    // Fallback to config dir
                    match dirs::config_dir() {
                        Some(mut path) => {
                            path.push("Btic");
                            path.push("ConfigConnectorTickelia");
                            path.push("config");
                            path.to_string_lossy().to_string()
                        }
                        None => "config".to_string(),
                    }
                }
            }
        }
    };

    // Save encrypted data to file
    match save_encrypted_data(&encrypted_data, &output_path) {
        Ok(_) => {
            println!("Encrypted data saved to: {}", output_path);
            Ok(EncryptionResult {
                success: true,
                message: format!("Encryption successful. File saved to: {}", output_path),
                file_path: output_path,
            })
        }
        Err(e) => Err(format!("Failed to save file: {}", e)),
    }
}

// Function to get computer info with hardcoded MAC address
fn get_computer_info() -> String {
    // We'll collect all available MAC addresses with their interface names
    let mut selected_mac = String::new();

    // Use ipconfig to get detailed network interface information on Windows
    if let Ok(output) = Command::new("ipconfig").arg("/all").output() {
        if let Ok(output_str) = String::from_utf8(output.stdout) {
            let mut interfaces = Vec::new();
            let mut current_interface: Option<(String, String)> = None;

            // Parse ipconfig output line by line
            for line in output_str.lines() {
                let line = line.trim();

                // New interface section starts with a description
                if line.contains("adapter") && line.ends_with(":") {
                    // Save previous interface if we found one
                    if let Some((name, mac)) = current_interface.take() {
                        if !mac.is_empty() {
                            interfaces.push((name, mac));
                        }
                    }

                    // Start a new interface
                    let name = line.trim_end_matches(":");
                    current_interface = Some((name.to_string(), String::new()));
                }

                // Look for Physical Address (MAC)
                if line.contains("Physical Address") {
                    if let Some(mac_part) = line.split(":").nth(1) {
                        if let Some((_name, mac)) = &mut current_interface {
                            *mac = mac_part.trim().replace("-", "").replace(":", "");
                        }
                    }
                }
            }

            // Add the last interface
            if let Some((name, mac)) = current_interface {
                if !mac.is_empty() {
                    interfaces.push((name, mac));
                }
            }

            // Debug output of all found interfaces
            println!("Found {} network interfaces:", interfaces.len());
            for (i, (name, mac)) in interfaces.iter().enumerate() {
                println!("  [{}] {} -> {}", i, name, mac);
            }

            // Now apply the same selection logic as in the Go app
            // First try with preferred interfaces
            for (name, mac) in &interfaces {
                let name_lower = name.to_lowercase();
                if !name_lower.contains("virtual")
                    && !name_lower.contains("vpn")
                    && !name_lower.contains("vethernet")
                    && !name_lower.contains("loopback")
                    && ((name_lower.contains("ethernet") && !name_lower.contains("vethernet"))
                        || name_lower.contains("wi-fi")
                        || name_lower.contains("wlan"))
                {
                    selected_mac = mac.clone();
                    println!("Selected interface: {} with MAC: {}", name, mac);
                    break;
                }
            }

            // Fallback to less strict criteria
            if selected_mac.is_empty() {
                for (name, mac) in &interfaces {
                    let name_lower = name.to_lowercase();
                    if !name_lower.contains("loopback") {
                        selected_mac = mac.clone();
                        println!("Fallback interface: {} with MAC: {}", name, mac);
                        break;
                    }
                }
            }
        }
    }

    // If automatic detection failed, fall back to the hardcoded MAC
    if selected_mac.is_empty() {
        selected_mac = "902E168B9AC1".to_string();
        println!("Using hardcoded fallback MAC address: {}", selected_mac);
    }

    // Get hostname the same way as before
    let hostname = match hostname::get() {
        Ok(name) => name.to_string_lossy().into_owned(),
        Err(_) => "unknown".to_string(),
    };

    // Combine MAC and hostname
    let result = format!("{}{}", selected_mac, hostname);
    println!("Raw computer info (before padding): {}", result);
    result
}

// Function to pad a string with a specific character to reach the specified length
fn pad_with_char(input: &str, length: usize, pad_char: char) -> String {
    let mut result = input.to_string();
    if result.len() > length {
        result.truncate(length);
    } else {
        while result.len() < length {
            result.push(pad_char);
        }
    }
    result
}

// Function to create a key of specified length based on computer info
fn get_key(key_length: usize, computer_info: &str, pad_char: char) -> Vec<u8> {
    let padded_info = pad_with_char(computer_info, key_length, pad_char);
    padded_info.into_bytes()
}

// Function to encrypt data using AES-CBC with PKCS7 padding
fn encrypt_data(data: &[u8], key: &[u8], iv: &[u8]) -> Result<Vec<u8>, String> {
    // Print debug info
    println!("Data length: {} bytes", data.len());
    println!("Key length: {} bytes", key.len());
    println!("IV length: {} bytes", iv.len());

    // Create AES-CBC cipher
    let cipher = match Aes256CbcEnc::new_from_slices(key, iv) {
        Ok(c) => c,
        Err(e) => return Err(format!("Error creating cipher: {}", e)),
    };

    // Calculate needed buffer size (data length + padding)
    let block_size = 16; // AES block size is always 16 bytes
    let padding_len = block_size - (data.len() % block_size);
    let buffer_len = data.len() + padding_len;

    println!(
        "Buffer size calculated: {} bytes (with {} padding)",
        buffer_len, padding_len
    );

    // Create properly sized buffer
    let mut buffer = vec![0u8; buffer_len];
    buffer[..data.len()].copy_from_slice(data);

    // Encrypt with PKCS7 padding
    match cipher.encrypt_padded_mut::<Pkcs7>(&mut buffer, data.len()) {
        Ok(encrypted) => {
            println!(
                "Encryption successful, output length: {} bytes",
                encrypted.len()
            );
            Ok(encrypted.to_vec())
        }
        Err(e) => Err(format!("Error during encryption: {}", e)),
    }
}

// Function to decrypt data using AES-CBC with PKCS7 padding
// Kept for potential future use
#[allow(dead_code)]
fn decrypt_data(encrypted_data: &[u8], key: &[u8], iv: &[u8]) -> Result<Vec<u8>, String> {
    // Create buffer for decrypted output (same size as input)
    let mut buffer = encrypted_data.to_vec();

    // Create AES-CBC cipher for decryption
    let cipher = Aes256CbcDec::new_from_slices(key, iv)
        .map_err(|e| format!("Error creating cipher: {}", e))?;

    // Decrypt with PKCS7 unpadding
    let decrypted = cipher
        .decrypt_padded_mut::<Pkcs7>(&mut buffer)
        .map_err(|e| format!("Error during decryption: {}", e))?;

    Ok(decrypted.to_vec())
}

// Function to save encrypted data to a file
fn save_encrypted_data(data: &[u8], file_path: &str) -> Result<(), String> {
    // Create parent directories if they don't exist
    if let Some(parent) = Path::new(file_path).parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    // Write data to file
    fs::write(file_path, data).map_err(|e| format!("Failed to write file: {}", e))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DecryptionResult {
    success: bool,
    message: String,
    json_data: String,
}

#[tauri::command]
pub async fn decrypt_json(
    _app_handle: AppHandle,
    file_path: Option<String>,
    char_key: Option<String>,
    username: Option<String>,
) -> Result<DecryptionResult, String> {
    // Parse char_key or use default "T"
    let char_key = char_key.unwrap_or_else(|| "T".to_string());
    let char_key = char_key.chars().next().unwrap_or('T');

    // Get computer info for key generation
    let computer_info = get_computer_info();

    // Generate key and IV
    let key = get_key(32, &computer_info, char_key);
    let iv = get_key(16, &computer_info, char_key);

    // Determine input path
    let input_path = match file_path {
        Some(path) => path,
        None => {
            // Check if username is provided and use it to construct the path
            if let Some(user) = username {
                match dirs::download_dir() {
                    Some(mut path) => {
                        path.push(format!("config-{}", user));
                        path.to_string_lossy().to_string()
                    }
                    None => {
                        // Fallback to config dir
                        match dirs::config_dir() {
                            Some(mut path) => {
                                path.push("Btic");
                                path.push("ConfigConnectorTickelia");
                                path.push(format!("config-{}", user));
                                path.to_string_lossy().to_string()
                            }
                            None => format!("config-{}", user),
                        }
                    }
                }
            } else {
                // Default path without username
                match dirs::download_dir() {
                    Some(mut path) => {
                        path.push("config");
                        path.to_string_lossy().to_string()
                    }
                    None => {
                        // Fallback to config dir
                        match dirs::config_dir() {
                            Some(mut path) => {
                                path.push("Btic");
                                path.push("ConfigConnectorTickelia");
                                path.push("config");
                                path.to_string_lossy().to_string()
                            }
                            None => "config".to_string(),
                        }
                    }
                }
            }
        }
    };

    // Read the encrypted file
    let encrypted_data = match fs::read(&input_path) {
        Ok(data) => data,
        Err(e) => return Err(format!("Failed to read file: {}", e)),
    };

    // Decrypt the data
    let decrypted_data = match decrypt_data(&encrypted_data, &key, &iv) {
        Ok(data) => data,
        Err(e) => return Err(format!("Decryption error: {}", e)),
    };

    // Convert decrypted bytes to string
    match String::from_utf8(decrypted_data) {
        Ok(json_string) => Ok(DecryptionResult {
            success: true,
            message: "Decryption successful".to_string(),
            json_data: json_string,
        }),
        Err(e) => Err(format!("Failed to convert decrypted data to string: {}", e)),
    }
}

#[tauri::command]
pub async fn config_exists(_app_handle: AppHandle, username: String) -> Result<bool, String> {
    // Check in downloads directory first
    let download_path = match dirs::download_dir() {
        Some(mut path) => {
            path.push(format!("config-{}", username));
            if path.exists() {
                return Ok(true);
            }
            path
        }
        None => Path::new(&format!("config-{}", username)).to_path_buf(),
    };

    // Then check in config directory
    let config_path = match dirs::config_dir() {
        Some(mut path) => {
            path.push("Btic");
            path.push("ConfigConnectorTickelia");
            path.push(format!("config-{}", username));
            if path.exists() {
                return Ok(true);
            }
            path
        }
        None => Path::new(&format!("config-{}", username)).to_path_buf(),
    };

    // Finally check in current directory
    let current_path_string = format!("config-{}", username);
    let current_path = Path::new(&current_path_string);

    Ok(download_path.exists() || config_path.exists() || current_path.exists())
}
