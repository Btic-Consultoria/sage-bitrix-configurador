use std::process::Command;
use tauri::AppHandle;

// The exact service name from the project files
const SERVICE_NAME: &str = "ConnectorSageBitrix";

#[tauri::command]
pub fn check_service_status(_app_handle: AppHandle) -> Result<bool, String> {
    println!("RUST: check_service_status called for '{}'", SERVICE_NAME);
    
    // Try PowerShell directly - simplest approach
    let output = match Command::new("powershell")
        .args(&[
            "-Command", 
            &format!("(Get-Service -Name '{}' -ErrorAction SilentlyContinue).Status -eq 'Running'", SERVICE_NAME)
        ])
        .output() {
            Ok(out) => out,
            Err(e) => {
                let err_msg = format!("Failed to execute PowerShell: {}", e);
                println!("RUST ERROR: {}", err_msg);
                return Err(err_msg);
            }
        };
    
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr);
    
    println!("RUST: PowerShell output: '{}', success: {}", stdout, output.status.success());
    
    if !stderr.is_empty() {
        println!("RUST: PowerShell stderr: {}", stderr);
    }
    
    // If output contains "True", service is running
    if stdout.to_lowercase() == "true" {
        println!("RUST: Service is running");
        return Ok(true);
    }
    
    // Check for errors
    if !output.status.success() || stderr.contains("error") {
        if stderr.contains("Cannot find any service") || stderr.contains("ObjectNotFound") {
            let err_msg = format!("Service '{}' not found", SERVICE_NAME);
            println!("RUST ERROR: {}", err_msg);
            return Err(err_msg);
        }
        
        if stderr.contains("Access is denied") || stderr.contains("permission") {
            let err_msg = "Access is denied. Administrator privileges required".to_string();
            println!("RUST ERROR: {}", err_msg);
            return Err(err_msg);
        }
        
        let err_msg = format!("Error checking service: {}", stderr);
        println!("RUST ERROR: {}", err_msg);
        return Err(err_msg);
    }
    
    // If no errors but not running, service is stopped
    println!("RUST: Service is stopped");
    return Ok(false);
}

#[tauri::command]
pub fn start_service(_app_handle: AppHandle) -> Result<bool, String> {
    println!("RUST: start_service called for '{}'", SERVICE_NAME);
    
    // Try PowerShell directly
    let output = match Command::new("powershell")
        .args(&[
            "-Command", 
            &format!("Start-Service -Name '{}' -ErrorAction Stop; $?", SERVICE_NAME)
        ])
        .output() {
            Ok(out) => out,
            Err(e) => {
                let err_msg = format!("Failed to execute PowerShell: {}", e);
                println!("RUST ERROR: {}", err_msg);
                return Err(err_msg);
            }
        };
    
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr);
    
    println!("RUST: PowerShell output: '{}', success: {}", stdout, output.status.success());
    
    if !stderr.is_empty() {
        println!("RUST: PowerShell stderr: {}", stderr);
    }
    
    // Check for success
    if output.status.success() && (stdout.to_lowercase() == "true" || stdout.is_empty()) {
        println!("RUST: Service start successful");
        return Ok(true);
    }
    
    // Check for specific errors
    if stderr.contains("Cannot find any service") || stderr.contains("ObjectNotFound") {
        let err_msg = format!("Service '{}' not found", SERVICE_NAME);
        println!("RUST ERROR: {}", err_msg);
        return Err(err_msg);
    }
    
    if stderr.contains("Access is denied") || stderr.contains("permission") {
        let err_msg = "Access is denied. Administrator privileges required".to_string();
        println!("RUST ERROR: {}", err_msg);
        return Err(err_msg);
    }
    
    // Generic error
    let err_msg = format!("Failed to start service: {}", stderr);
    println!("RUST ERROR: {}", err_msg);
    return Err(err_msg);
}

// Add a simple echo command for testing Tauri invoke
#[tauri::command]
pub fn echo_test(message: String) -> String {
    println!("RUST: echo_test called with message: '{}'", message);
    format!("Echo from Rust: {}", message)
}