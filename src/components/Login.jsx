import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import LanguageSwitcher from "./LanguageSwitcher";

// Set to true to enable development mode
const DEV_MODE = false;

function Login({ onLogin }) {
  const { t, i18n } = useTranslation(); // Get i18n object to track language directly
  const logoPath = "/btic-logo-black.svg";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  // Track language changes without side effects
  useEffect(() => {
    // Only update the tracked language
    if (currentLanguage !== i18n.language) {
      setCurrentLanguage(i18n.language);

      // If there's an error message, translate it to the new language
      // without clearing it or triggering any other behavior
      if (error) {
        // If the error is a known translation key, update it to the new language
        if (error === t("auth.loginError", { lng: currentLanguage })) {
          setError(t("auth.loginError"));
        }
        // Otherwise, leave the custom error message as is
      }
    }
  }, [i18n.language, currentLanguage, t]);

  // Add a flag to prevent automatic login during language changes
  const isChangingLanguage = useRef(false);

  useEffect(() => {
    // When language changes, set the flag
    isChangingLanguage.current = true;

    // Reset the flag after a short delay
    const timer = setTimeout(() => {
      isChangingLanguage.current = false;
    }, 100);

    return () => clearTimeout(timer);
  }, [i18n.language]);

  const tryLoadConfig = async (userData, token) => {
    try {
      // Attempt to decrypt any existing config file
      const result = await invoke("decrypt_json", {
        file_path: null, // Use default path
        char_key: "T", // Use the default key
        username: null, // No longer need the username for the path
      });

      if (result.success && result.json_data) {
        // Parse the JSON data
        const configData = JSON.parse(result.json_data);
        console.log("Loaded config data:", configData);

        // Map the data to our application structure
        const appConfig = {
          clientCode: configData.CodigoCliente || userData.username,
          database: {
            dbHost: configData.DB?.DB_Host || "",
            dbHostSage: configData.DB?.DB_Host_Sage || "",
            dbPort: configData.DB?.DB_Port || "",
            dbDatabase: configData.DB?.DB_Database || "",
            dbUsername: configData.DB?.DB_Username || "",
            dbPassword: configData.DB?.DB_Password || "",
            license: configData.DB?.IdLlicencia || "",
          },
          bitrix24: {
            apiTenant: configData.Bitrix24?.API_Tenant || "",
            packEmpresa: configData.Bitrix24?.pack_empresa || false,
          },
          companies:
            configData.Empresas?.map((e) => ({
              bitrixCompany: e.EmpresaBitrix || "",
              sageCompanyCode: e.EmpresaSage || "",
            })) || [],
        };

        // Call the login handler with the config data
        onLogin(userData, token, appConfig);
        return true;
      }
      return false;
    } catch (error) {
      console.warn("No config file found or error decrypting:", error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Prevent login during language changes
    if (isChangingLanguage.current) {
      console.log("Ignoring login attempt during language change");
      return;
    }

    // Basic validation
    if (!username.trim() || !password.trim()) {
      setError(t("auth.loginError"));
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

        // Try to load config first
        const configLoaded = await tryLoadConfig(
          mockUserData,
          "dev-mode-mock-token-123"
        );
        if (!configLoaded) {
          // If no config was loaded, just proceed with empty config
          onLogin(mockUserData, "dev-mode-mock-token-123");
        }

        return;
      }

      // Call Rust function for login
      const loginResult = await invoke("login_api", {
        username,
        password,
      });

      if (!loginResult.success) {
        setError(loginResult.error || t("auth.loginError"));
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

      // Try to load config first
      const configLoaded = await tryLoadConfig(userData, token);
      if (!configLoaded) {
        // If no config was loaded, just proceed with empty config
        onLogin(userData, token);
      }
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

            {/* Add the language switcher at the top */}
            <div className="flex justify-center mb-4">
              <LanguageSwitcher />
            </div>

            <h2 className="text-2xl font-bold mb-2 text-center text-onyx-500">
              {t("auth.firstLogin")}
            </h2>
            <p className="mb-6 text-center text-onyx-400">
              {t("auth.setNewPassword")}
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
                {t("auth.newPassword")}
              </label>
              <input
                type="password"
                id="newPassword"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-onyx-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder={t("auth.newPassword")}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="confirmPassword"
                className="block text-onyx-600 text-sm font-bold mb-2"
              >
                {t("auth.confirmPassword")}
              </label>
              <input
                type="password"
                id="confirmPassword"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-onyx-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder={t("auth.confirmPassword")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-center">
              <button
                type="submit"
                className="bg-onyx-500 hover:bg-onyx-600 text-brand-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
              >
                {t("auth.setNewPasswordButton")}
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

          {/* Add the language switcher at the top */}
          <div className="flex justify-center mb-4">
            <LanguageSwitcher />
          </div>

          <h2 className="text-2xl font-bold mb-6 text-center text-onyx-500">
            {t("app.title")}
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
              {t("auth.username")}
            </label>
            <input
              type="text"
              id="username"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-onyx-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder={t("auth.username")}
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
              {t("auth.password")}
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-onyx-700 leading-tight focus:outline-none focus:shadow-outline"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.password")}
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
              {isLoading ? t("auth.signingIn") : t("auth.signIn")}
            </button>
          </div>
        </form>

        <p className="text-center text-onyx-700 text-xs">
          {t("footer.copyright")}
        </p>
      </div>
    </div>
  );
}

export default Login;
