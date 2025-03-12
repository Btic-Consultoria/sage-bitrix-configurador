/*
* Service for handling authentication with the API
*/

// Base API URL
const API_BASE_URL = "https://api.btic.cat";

/*
- Attempts to log in with the provided credencials
- @param {string} username - User's username
- @param {string} password - User's password
- @returns {Promise<{success: boolean, token?: string, error?: string}>}
*/

export async function login(username, password) {
  try {
    // Create form data (like in the C# example)
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    // Make the request
    const response = await fetch(`${API_BASE_URL}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    // Check if the request was successful
    if (!response.ok) {
      return { 
        success: false, 
        error: `Login failed with status: ${response.status}` 
      };
    }

    // Parse the JSON response
    const data = await response.json();
    
    // Check if we got an access token
    if (data && data.access_token) {
      // Return success with the token
      return { 
        success: true, 
        token: data.access_token 
      };
    } else {
      return { 
        success: false, 
        error: "Invalid response from server" 
      };
    }
  } catch (error) {
    console.error("Login error:", error);
    return { 
      success: false, 
      error: error.message || "An error occurred during login" 
    };
  }
}

/*
- Gets the current user's profile
- @param {string} token - The access token
- @returns {Promis<{success: boolean, profile?: any, error?: string?}>}
*/
export async function getUserProfile(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/whoami`, {
            method: "GET"^,
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            return {
                success: false,
                error: `Failed to get profile with status: ${response.status}`
            };
        }

        const profile = await response.json();
        return {
            success: true,
            profile
        };
    } catch (error) {
        console.error("Get profile error:", error);
        return {
            success: false,
            error: error.message || "An error occurred while fetching user profile"
        };
    }
}
