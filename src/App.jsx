import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

function App() {
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [configFromStorage, setConfigFromStorage] = useState(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);

  useEffect(() => {
    // Basic setup - just set loading to false
    setIsLoading(false);

    // We'll add the close event listener in a separate useEffect to avoid blocking render
  }, []);

  // Separate useEffect for Tauri-specific code to avoid blocking initial render
  useEffect(() => {
    const setupCloseHandler = async () => {
      try {
        // Dynamically import Tauri APIs to avoid potential issues during SSR/initial render
        // Updated for Tauri 2.0
        const { listen } = await import("@tauri-apps/api/event");

        // Set up listener for close events
        const unlisten = await listen("tauri://close-requested", () => {
          console.log("Close requested event received");
          setShowCloseConfirmation(true);
        });

        // Return cleanup function
        return () => {
          if (unlisten) {
            unlisten();
          }
        };
      } catch (err) {
        console.error("Failed to set up Tauri close handler:", err);
        return () => {}; // Return empty cleanup function
      }
    };

    // Set up the handler and store the cleanup function
    let cleanup = () => {};
    setupCloseHandler().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    // Return the cleanup function
    return () => cleanup();
  }, []);

  // Handle app close confirmation
  const handleConfirmClose = async () => {
    try {
      console.log("Attempting to close window...");

      // In Tauri 2.0, we should use the WebviewWindow's close method
      // Updated for Tauri 2.0
      const { getCurrent } = await import("@tauri-apps/api/window");
      const currentWindow = getCurrent();

      // Call close() on the current window
      console.log("Calling close on current window");
      await currentWindow.close();

      // Fallback - If we're still here after a second, try alternative methods
      setTimeout(() => {
        console.log("Fallback: trying alternative close methods");
        try {
          // Try the direct invocation with correct Tauri 2.0 import
          const { invoke } = require("@tauri-apps/api/core");
          invoke("force_exit");
        } catch (err) {
          console.error("Failed to invoke force_exit:", err);
          // Last resort fallback
          window.close();
        }
      }, 1000);
    } catch (err) {
      console.error("Failed to close window:", err);

      // Fallback to invoke a custom command
      try {
        console.log("Attempting to invoke force_exit command");
        // Updated for Tauri 2.0
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("force_exit");
      } catch (invokeErr) {
        console.error("Failed to invoke force_exit:", invokeErr);

        // Last resort fallback
        window.close();
      }
    }
  };

  // Handle app close cancellation
  const handleCancelClose = () => {
    setShowCloseConfirmation(false);
  };

  // ✅ Función para obtener mapeos por defecto
  const getDefaultFieldMappings = () => [
    {
      bitrixFieldName: "UF_CRM_COMPANY_CATEGORIA",
      bitrixFieldType: "string",
      sageFieldName: "CodigoCategoriaCliente",
      sageFieldDescription: "Código de categoría del cliente",
      isActive: true,
      isMandatory: true,
    },
    {
      bitrixFieldName: "UF_CRM_COMPANY_RAZON",
      bitrixFieldType: "string",
      sageFieldName: "RazonSocial",
      sageFieldDescription: "Razón social de la empresa",
      isActive: true,
      isMandatory: true,
    },
    {
      bitrixFieldName: "UF_CRM_COMPANY_DIVISA",
      bitrixFieldType: "string",
      sageFieldName: "CodigoDivisa",
      sageFieldDescription: "Código de divisa",
      isActive: true,
      isMandatory: false,
    },
    {
      bitrixFieldName: "UF_CRM_COMPANY_DOMICILIO",
      bitrixFieldType: "string",
      sageFieldName: "Domicilio",
      sageFieldDescription: "Dirección principal",
      isActive: true,
      isMandatory: false,
    },
    {
      bitrixFieldName: "UF_CRM_COMPANY_TELEFONO",
      bitrixFieldType: "string",
      sageFieldName: "Telefono",
      sageFieldDescription: "Número de teléfono",
      isActive: true,
      isMandatory: false,
    },
    {
      bitrixFieldName: "UF_CRM_COMPANY_EMAIL",
      bitrixFieldType: "string",
      sageFieldName: "EMail1",
      sageFieldDescription: "Correo electrónico principal",
      isActive: true,
      isMandatory: false,
    },
  ];

  // ✅ Handle successful login - Mejorado
  const handleLogin = (userData, authToken, initialConfig = null) => {
    console.log("App: Login successful", { userData, initialConfig }); // Debug log

    // Set user and auth info
    setToken(authToken);
    setUser(userData);

    // Set flag for whether config was loaded from storage
    const configLoaded = !!initialConfig;
    setConfigFromStorage(configLoaded);

    // ✅ Crear configuración inicial con fieldMappings incluidos
    const defaultConfig = {
      database: {
        dbHost: "",
        dbHostSage: "",
        dbPort: "",
        dbDatabase: "",
        dbUsername: "",
        dbPassword: "",
        license: "",
      },
      bitrix24: {
        apiTenant: "",
        packEmpresa: false,
      },
      companies: [],
      fieldMappings: getDefaultFieldMappings(), // ✅ Incluir siempre mapeos por defecto
    };

    // ✅ Merge con la configuración inicial si existe
    let finalConfig;
    if (initialConfig) {
      console.log("App: Using loaded config from storage"); // Debug log
      finalConfig = {
        ...defaultConfig,
        ...initialConfig,
        // ✅ Asegurar que fieldMappings existe, usar default si no hay ninguno
        fieldMappings:
          initialConfig.fieldMappings && initialConfig.fieldMappings.length > 0
            ? initialConfig.fieldMappings
            : getDefaultFieldMappings(),
      };
    } else {
      console.log("App: Using default config"); // Debug log
      finalConfig = defaultConfig;
    }

    console.log("App: Final config to set:", finalConfig); // Debug log
    setConfig(finalConfig);
    setIsAuthenticated(true);
  };

  // Handle logout request
  const requestLogout = () => {
    setShowLogoutConfirmation(true);
  };

  // Handle confirmed logout
  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setConfig(null);
    setIsAuthenticated(false);
    setShowLogoutConfirmation(false);
  };

  // Handle logout cancellation
  const cancelLogout = () => {
    setShowLogoutConfirmation(false);
  };

  // Update config data
  const updateConfig = (newConfig) => {
    console.log("App: Config updated:", newConfig); // Debug log
    setConfig(newConfig);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-onyx-100">
        <div className="text-onyx-500 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="App">
      {isAuthenticated ? (
        <>
          <Dashboard
            user={user}
            token={token}
            config={config}
            configFromStorage={configFromStorage}
            updateConfig={updateConfig}
            onLogout={requestLogout}
          />

          {/* Logout Confirmation Dialog */}
          {showLogoutConfirmation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-bold mb-4 text-onyx-600">
                  {t("dialogs.confirmLogout")}
                </h3>
                <p className="mb-6 text-onyx-500">
                  {t("dialogs.logoutWarning")}
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={cancelLogout}
                    className="px-4 py-2 border border-onyx-300 rounded-md text-onyx-600 hover:bg-onyx-100"
                  >
                    {t("dialogs.cancel")}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    {t("dialogs.logout")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* App Close Confirmation Dialog */}
          {showCloseConfirmation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-bold mb-4 text-onyx-600">
                  {t("dialogs.confirmExit")}
                </h3>
                <p className="mb-6 text-onyx-500">{t("dialogs.exitWarning")}</p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={handleCancelClose}
                    className="px-4 py-2 border border-onyx-300 rounded-md text-onyx-600 hover:bg-onyx-100"
                  >
                    {t("dialogs.cancel")}
                  </button>
                  <button
                    onClick={handleConfirmClose}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    {t("dialogs.exit")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <Login onLogin={handleLogin} />

          {/* App Close Confirmation Dialog - also available at login */}
          {showCloseConfirmation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-bold mb-4 text-onyx-600">
                  {t("dialogs.confirmExit")}
                </h3>
                <p className="mb-6 text-onyx-500">{t("dialogs.exitWarning")}</p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={handleCancelClose}
                    className="px-4 py-2 border border-onyx-300 rounded-md text-onyx-600 hover:bg-onyx-100"
                  >
                    {t("dialogs.cancel")}
                  </button>
                  <button
                    onClick={handleConfirmClose}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    {t("dialogs.exit")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
