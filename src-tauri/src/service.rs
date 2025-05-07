use std::process::Command;
use tauri::AppHandle;

// The exact service name from the project files
const SERVICE_NAME: &str = "ConnectorSageBitrix";

// Try to check service status using PowerShell
fn check_service_with_powershell(service_name: &str) -> Result<bool, String> {
    println!("Rust: Trying fallback with PowerShell");
    
    let output = match Command::new("powershell")
        .args(&["-Command", &format!("Get-Service -Name '{}' | Select-Object -ExpandProperty Status", service_name)])
        .output() {
            Ok(out) => out,
            Err(e) => {
                let err_msg = format!("Failed to execute PowerShell command: {}", e);
                println!("Rust PowerShell Error: {}", err_msg);
                return Err(err_msg);
            }
        };
        
    let status_code = output.status.code().unwrap_or(1);
    let output_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr);
    
    println!("Rust PowerShell: Command output: '{}'", output_str);
    if !stderr.is_empty() {
        println!("Rust PowerShell: Command stderr: \n{}", stderr);
    }
    println!("Rust PowerShell: Command exit code: {}", status_code);
    
    if status_code != 0 {
        return Err(format!("PowerShell command failed: {}", stderr));
    }
    
    // PowerShell returns "Running" if the service is running
    let is_running = output_str.contains("Running");
    println!("Rust PowerShell: Service running status: {}", is_running);
    
    Ok(is_running)
}

// Function to start service using PowerShell
fn start_service_with_powershell(service_name: &str) -> Result<bool, String> {
    println!("Rust: Trying to start service with PowerShell");
    
    let output = match Command::new("powershell")
        .args(&["-Command", &format!("Start-Service -Name '{}' -ErrorAction Stop", service_name)])
        .output() {
            Ok(out) => out,
            Err(e) => {
                let err_msg = format!("Failed to execute PowerShell command: {}", e);
                println!("Rust PowerShell Error: {}", err_msg);
                return Err(err_msg);
            }
        };
        
    let status_code = output.status.code().unwrap_or(1);
    let output_str = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    
    println!("Rust PowerShell: Start service output: '{}'", output_str);
    if !stderr.is_empty() {
        println!("Rust PowerShell: Start service stderr: \n{}", stderr);
    }
    println!("Rust PowerShell: Start service exit code: {}", status_code);
    
    if status_code != 0 {
        if stderr.contains("Access is denied") {
            return Err("Access is denied. Requires administrator privileges.".to_string());
        }
        if stderr.contains("Cannot find any service") {
            return Err(format!("Service '{}' not found. Please check if it's installed.", service_name));
        }
        return Err(format!("PowerShell command failed: {}", stderr));
    }
    
    println!("Rust PowerShell: Service start command successful");
    Ok(true)
}

#[tauri::command]
pub fn check_service_status(_app_handle: AppHandle) -> Result<bool, String> {
    println!("Rust: check_service_status called");
    
    // First try with SC command
    println!("Rust: Executing 'sc query {}'", SERVICE_NAME);
    match Command::new("sc")
        .args(&["query", SERVICE_NAME])
        .output() {
            Ok(output) => {
                let status_code = output.status.code().unwrap_or(1);
                let output_str = String::from_utf8_lossy(&output.stdout);
                let stderr = String::from_utf8_lossy(&output.stderr);
                
                println!("Rust: Command output: \n{}", output_str);
                if !stderr.is_empty() {
                    println!("Rust: Command stderr: \n{}", stderr);
                }
                println!("Rust: Command exit code: {}", status_code);
                
                // Check for the "RUNNING" state
                let is_running = output_str.contains("RUNNING");
                
                // Check for specific error scenarios
                if status_code != 0 || (!is_running && !output_str.contains("STOPPED")) {
                    // Try to provide more specific error information
                    if stderr.contains("Access is denied") || output_str.contains("Access is denied") {
                        let err_msg = "Access is denied. Requires administrator privileges.".to_string();
                        println!("Rust Error: {}", err_msg);
                        return Err(err_msg);
                    }
                    
                    if output_str.contains("The specified service does not exist") || 
                       output_str.contains("service name is invalid") {
                        // Try PowerShell as fallback before giving up
                        println!("Service not found with SC, trying PowerShell");
                        return check_service_with_powershell(SERVICE_NAME);
                    }
                    
                    // If not a specific error but status code is not 0, return a general error
                    if status_code != 0 {
                        let err_msg = format!("Error checking service status: {}", stderr);
                        println!("Rust Error: {}", err_msg);
                        
                        // Try PowerShell as fallback
                        println!("Error with SC command, trying PowerShell");
                        return check_service_with_powershell(SERVICE_NAME);
                    }
                }
                
                println!("Rust: Service running status: {}", is_running);
                Ok(is_running)
            },
            Err(e) => {
                let err_msg = if e.kind() == std::io::ErrorKind::NotFound {
                    "SC command not found. Trying PowerShell instead.".to_string()
                } else {
                    format!("Failed to execute SC command: {}. Trying PowerShell instead.", e)
                };
                println!("Rust: {}", err_msg);
                
                // Try PowerShell as fallback
                check_service_with_powershell(SERVICE_NAME)
            }
        }
}

#[tauri::command]
pub fn start_service(_app_handle: AppHandle) -> Result<bool, String> {
    println!("Rust: start_service called");
    
    // First try with SC command
    println!("Rust: Executing 'sc start {}'", SERVICE_NAME);
    match Command::new("sc")
        .args(&["start", SERVICE_NAME])
        .output() {
            Ok(output) => {
                let status_code = output.status.code().unwrap_or(1);
                let output_str = String::from_utf8_lossy(&output.stdout);
                let stderr = String::from_utf8_lossy(&output.stderr);
                
                println!("Rust: Command output: \n{}", output_str);
                if !stderr.is_empty() {
                    println!("Rust: Command stderr: \n{}", stderr);
                }
                println!("Rust: Command exit code: {}", status_code);
                
                // Check for specific errors
                if !output.status.success() {
                    if stderr.contains("Access is denied") || output_str.contains("Access is denied") {
                        let err_msg = "Access is denied. Requires administrator privileges.".to_string();
                        println!("Rust Error: {}", err_msg);
                        return Err(err_msg);
                    }
                    
                    if stderr.contains("does not exist") || output_str.contains("does not exist") {
                        // Try PowerShell as fallback
                        println!("Service not found with SC, trying PowerShell");
                        return start_service_with_powershell(SERVICE_NAME);
                    }
                    
                    let err_msg = format!("Failed to start service: {}", stderr);
                    println!("Rust Error: {}", err_msg);
                    
                    // Try PowerShell as fallback
                    println!("Error with SC command, trying PowerShell");
                    return start_service_with_powershell(SERVICE_NAME);
                }

                println!("Rust: Service start command successful");
                Ok(true)
            },
            Err(e) => {
                let err_msg = if e.kind() == std::io::ErrorKind::NotFound {
                    "SC command not found. Trying PowerShell instead.".to_string()
                } else {
                    format!("Failed to execute SC command: {}. Trying PowerShell instead.", e)
                };
                println!("Rust: {}", err_msg);
                
                // Try PowerShell as fallback
                start_service_with_powershell(SERVICE_NAME)
            }
        }
}