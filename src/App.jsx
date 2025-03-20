import { useState, useEffect } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

function App() {
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

  // Handle successful login
  const handleLogin = (userData, authToken, initialConfig = null) => {
    // Set user and auth info
    setToken(authToken);
    setUser(userData);

    // Set flag for whether config was loaded from storage
    const configLoaded = !!initialConfig;
    setConfigFromStorage(configLoaded);

    // Set initial config from decrypted file or empty defaults
    setConfig(
      initialConfig || {
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
      },
    );

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
                  Confirm Logout
                </h3>
                <p className="mb-6 text-onyx-500">
                  Have you saved your configuration data? Any unsaved changes
                  will be lost.
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={cancelLogout}
                    className="px-4 py-2 border border-onyx-300 rounded-md text-onyx-600 hover:bg-onyx-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Logout
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
                  Confirm Exit
                </h3>
                <p className="mb-6 text-onyx-500">
                  Are you sure you want to exit the application? Any unsaved
                  changes will be lost.
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={handleCancelClose}
                    className="px-4 py-2 border border-onyx-300 rounded-md text-onyx-600 hover:bg-onyx-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmClose}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Exit
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
                  Confirm Exit
                </h3>
                <p className="mb-6 text-onyx-500">
                  Are you sure you want to exit the application?
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={handleCancelClose}
                    className="px-4 py-2 border border-onyx-300 rounded-md text-onyx-600 hover:bg-onyx-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmClose}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Exit
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
