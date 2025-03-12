use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResult {
    success: bool,
    token: Option<String>,
    token_type: Option<String>,
    first_login: Option<bool>,
    error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct TokenResponse {
    access_token: String,
    token_type: String,
    first_login: bool,
}

#[tauri::command]
pub async fn login_api(
    _app_handle: AppHandle,
    username: String,
    password: String,
) -> Result<LoginResult, String> {
    let client = Client::new();

    // Build form data
    let mut form = std::collections::HashMap::new();
    form.insert("username", username);
    form.insert("password", password);

    // Make the request
    let response = match client
        .post("https://api.btic.cat/token")
        .form(&form)
        .send()
        .await
    {
        Ok(resp) => resp,
        Err(e) => {
            return Ok(LoginResult {
                success: false,
                token: None,
                token_type: None,
                first_login: None,
                error: Some(format!("Request error: {}", e)),
            })
        }
    };

    // Check status
    if !response.status().is_success() {
        return Ok(LoginResult {
            success: false,
            token: None,
            token_type: None,
            first_login: None,
            error: Some(format!("Login failed with status: {}", response.status())),
        });
    }

    // Parse response
    match response.json::<TokenResponse>().await {
        Ok(token_data) => Ok(LoginResult {
            success: true,
            token: Some(token_data.access_token),
            token_type: Some(token_data.token_type),
            first_login: Some(token_data.first_login),
            error: None,
        }),
        Err(e) => Ok(LoginResult {
            success: false,
            token: None,
            token_type: None,
            first_login: None,
            error: Some(format!("Failed to parse response: {}", e)),
        }),
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserProfile {
    codi_client: String,
    tipus_usuari_id_id: String,
    empresa: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProfileResult {
    success: bool,
    profile: Option<UserProfile>,
    error: Option<String>,
}

#[tauri::command]
pub async fn get_user_profile(
    _app_handle: AppHandle,
    token: String,
) -> Result<ProfileResult, String> {
    let client = Client::new();

    // Make the request with the token
    let response = match client
        .get("https://api.btic.cat/whoami")
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
    {
        Ok(resp) => resp,
        Err(e) => {
            return Ok(ProfileResult {
                success: false,
                profile: None,
                error: Some(format!("Request error: {}", e)),
            })
        }
    };

    // Check status
    if !response.status().is_success() {
        return Ok(ProfileResult {
            success: false,
            profile: None,
            error: Some(format!(
                "Failed to get profile with status: {}",
                response.status()
            )),
        });
    }

    // Parse response
    match response.json::<UserProfile>().await {
        Ok(profile_data) => Ok(ProfileResult {
            success: true,
            profile: Some(profile_data),
            error: None,
        }),
        Err(e) => Ok(ProfileResult {
            success: false,
            profile: None,
            error: Some(format!("Failed to parse profile: {}", e)),
        }),
    }
}
