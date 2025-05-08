use std::process::Command;
use tauri::AppHandle;

// The exact service name from the project files
const SERVICE_NAME: &str = "ConnectorSageBitrix";

#[tauri::command]
pub fn check_service_status(_app_handle: AppHandle) -> Result<bool, String> {
    println!("RUST: check_service_status called for '{}'", SERVICE_NAME);
    
    // Try SC command first - more reliable for permissions
    println!("RUST: Trying SC command");
    match Command::new("sc")
        .args(&["query", SERVICE_NAME])
        .output() {
            Ok(output) => {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let stderr = String::from_utf8_lossy(&output.stderr);
                
                println!("RUST: SC command stdout: '{}'", stdout);
                if !stderr.is_empty() {
                    println!("RUST: SC command stderr: '{}'", stderr);
                }
                
                if !output.status.success() {
                    if stdout.contains("no existe") || stdout.contains("not exist") || 
                       stdout.contains("no se encontró") || stdout.contains("not found") {
                        return Err(format!("Service '{}' not found", SERVICE_NAME));
                    }
                    
                    if stdout.contains("acceso denegado") || stdout.contains("access denied") {
                        return Err("Administrator privileges required".to_string());
                    }
                    
                    // For other errors, try PowerShell as fallback
                    println!("RUST: SC command failed, trying PowerShell");
                    return check_service_with_powershell();
                }
                
                // Check if service is running
                let is_running = stdout.contains("RUNNING") || 
                                stdout.contains("EJECUT") || 
                                stdout.contains("EN EJECUCIÓN");
                
                println!("RUST: Service is {}", if is_running { "running" } else { "stopped" });
                Ok(is_running)
            },
            Err(_) => {
                println!("RUST: SC command not found, trying PowerShell");
                check_service_with_powershell()
            }
        }
}

fn check_service_with_powershell() -> Result<bool, String> {
    println!("RUST: Using PowerShell to check service status");
    
    // Use a simpler command that's less likely to have permission issues
    let output = match Command::new("powershell")
        .args(&[
            "-NoProfile", 
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
    
    // Try SC command first - much better for permissions with services
    println!("RUST: Trying SC command to start service");
    match Command::new("sc")
        .args(&["start", SERVICE_NAME])
        .output() {
            Ok(output) => {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let stderr = String::from_utf8_lossy(&output.stderr);
                
                println!("RUST: SC start stdout: '{}'", stdout);
                if !stderr.is_empty() {
                    println!("RUST: SC start stderr: '{}'", stderr);
                }
                
                // SC might return success even if service didn't start
                if output.status.success() && !stdout.contains("error") && !stdout.contains("ERROR") {
                    println!("RUST: Service start command successful");
                    return Ok(true);
                }
                
                // Check for specific errors
                if stdout.contains("no existe") || stdout.contains("not exist") || 
                   stdout.contains("no se encontró") || stdout.contains("not found") {
                    return Err(format!("Service '{}' not found", SERVICE_NAME));
                }
                
                if stdout.contains("acceso denegado") || stdout.contains("access denied") {
                    // Special error for services that require elevated privileges
                    if stdout.contains("service specific error") || stdout.contains("error específico del servicio") {
                        return Err("This service requires administrative privileges. Please run the service from Services Manager.".to_string());
                    }
                    return Err("Administrator privileges required".to_string());
                }
                
                // For other errors, try net start as fallback
                println!("RUST: SC start failed, trying NET START");
                start_service_with_net()
            },
            Err(_) => {
                println!("RUST: SC command not found, trying NET START");
                start_service_with_net()
            }
        }
}

fn start_service_with_net() -> Result<bool, String> {
    // Try net start - this sometimes works when sc fails
    println!("RUST: Using NET START to start service");
    let output = match Command::new("net")
        .args(&["start", SERVICE_NAME])
        .output() {
            Ok(out) => out,
            Err(e) => {
                let err_msg = format!("Failed to execute NET START: {}", e);
                println!("RUST ERROR: {}", err_msg);
                return Err(err_msg);
            }
        };
    
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    
    println!("RUST: NET START output: '{}', success: {}", stdout, output.status.success());
    
    if !stderr.is_empty() {
        println!("RUST: NET START stderr: {}", stderr);
    }
    
    if output.status.success() {
        println!("RUST: Service start successful via NET START");
        return Ok(true);
    }
    
    // If NET START failed, provide specific guidance
    let error_msg = format!("Cannot start the service: {}. Try starting it from Windows Services Manager (services.msc). Error details: {}", SERVICE_NAME, stderr);
    println!("RUST ERROR: {}", error_msg);
    return Err(error_msg);
}

// Add a simple echo command for testing Tauri invoke
#[tauri::command]
pub fn echo_test(message: String) -> String {
    println!("RUST: echo_test called with message: '{}'", message);
    format!("Echo from Rust: {}", message)
}

// New command to open services.msc
#[tauri::command]
pub fn open_services_manager(_app_handle: AppHandle) -> Result<String, String> {
    println!("RUST: Opening Windows Services Manager (services.msc)");
    
    // Method 1: Try using cmd
    let output = match Command::new("cmd")
        .args(&["/c", "start", "services.msc"])
        .output() {
            Ok(out) => out,
            Err(e) => {
                // Try method 2 if method 1 fails
                println!("RUST: CMD failed to open services.msc: {}", e);
                
                // Try using powershell
                match Command::new("powershell")
                    .args(&["-Command", "Start-Process", "services.msc"])
                    .output() {
                        Ok(ps_out) => ps_out,
                        Err(ps_e) => {
                            return Err(format!("Failed to open services.msc: {} / {}", e, ps_e));
                        }
                    }
            }
        };
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to open services.msc: {}", stderr));
    }
    
    println!("RUST: Successfully opened services.msc");
    Ok("Services Manager opened successfully".to_string())
}