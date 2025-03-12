import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

// Set to true to enable development mode
const DEV_MODE = false;

function Login({ onLogin }) {
  const logoPath = "/btic-logo-black.svg";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    // If we're in first login mode, validate the new password
    if (isFirstLogin) {
      if (!newPassword.trim()) {
        setError("Please enter a new password");
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("Passwords don't match");
        return;
      }

      // Here you would call an API to update the password
      // For now we'll just simulate it
      setIsFirstLogin(false);
      // Then continue with normal login with the new password
    }

    // Clear error if validation passes
    setError("");
    setIsLoading(true);

    try {
      // Development mode bypass
      if (DEV_MODE) {
        console.log("DEV MODE: Bypassing actual authentication");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const mockUserData = {
          username,
          profile: {
            codi_client: username,
            tipus_usuari_id_id: "admin",
            empresa: "Dev Company",
          },
          userType: "admin",
          company: "Dev Company",
          clientCode: username,
        };
        onLogin(mockUserData, "dev-mode-mock-token-123");
        return;
      }

      // Call Rust function for login
      const loginResult = await invoke("login_api", {
        username,
        password,
      });

      if (!loginResult.success) {
        setError(
          loginResult.error || "Login failed. Please check your credentials."
        );
        setIsLoading(false);
        return;
      }

      // Check if this is the user's first login
      if (loginResult.first_login) {
        setIsFirstLogin(true);
        setIsLoading(false);
        return;
      }

      const token = loginResult.token;

      // Get user profile
      const profileResult = await invoke("get_user_profile", {
        token,
      });

      if (!profileResult.success) {
        setError("Login successful but failed to get user profile");
        setIsLoading(false);
        return;
      }

      // We have everything we need
      const userData = {
        username,
        profile: profileResult.profile,
        // Extract specific data if needed
        userType: profileResult.profile.tipus_usuari_id_id,
        company: profileResult.profile.empresa,
        clientCode: profileResult.profile.codi_client,
      };

      // Call the login handler
      onLogin(userData, token);
    } catch (error) {
      console.error("Login process error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Render first login form
  if (isFirstLogin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-onyx-100">
        <div className="w-full max-w-md">
          <form
            onSubmit={handleSubmit}
            className="bg-brand-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4"
          >
            <div className="flex justify-center mb-4">
              <img src={logoPath} alt="BTC Logo" className="h-20 w-auto" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-center text-onyx-500">
              First Login
            </h2>
            <p className="mb-6 text-center text-onyx-400">
              Please set a new password for your account
            </p>

            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label
                htmlFor="newPassword"
                className="block text-onyx-600 text-sm font-bold mb-2"
              >
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-onyx-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="confirmPassword"
                className="block text-onyx-600 text-sm font-bold mb-2"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-onyx-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-center">
              <button
                type="submit"
                className="bg-onyx-500 hover:bg-onyx-600 text-brand-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
              >
                Set New Password
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Render normal login form
  return (
    <div className="flex items-center justify-center min-h-screen bg-onyx-100">
      <div className="w-full max-w-md">
        {DEV_MODE && (
          <div className="mb-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded text-center">
            🚧 Development Mode Enabled 🚧
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="bg-brand-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4"
        >
          <div className="flex justify-center mb-4">
            <img src={logoPath} alt="BTC Logo" className="h-20 w-auto" />
          </div>
          <h2 className="text-2xl font-bold mb-6 text-center text-onyx-500">
            Sage-Bitrix Configurator
          </h2>

          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-onyx-600 text-sm font-bold mb-2"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-onyx-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-onyx-600 text-sm font-bold mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-onyx-700 leading-tight focus:outline-none focus:shadow-outline"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-center">
            <button
              type="submit"
              className={`bg-onyx-500 hover:bg-onyx-600 text-brand-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        </form>

        <p className="text-center text-onyx-700 text-xs">
          &copy;2025 Bussiness Tic Consultoria. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default Login;
