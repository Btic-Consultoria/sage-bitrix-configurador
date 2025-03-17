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

  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Handle successful login
  const handleLogin = (userData, authToken, initialConfig = null) => {
    // Set user and auth info
    setToken(authToken);
    setUser(userData);

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
        },
        companies: [],
      }
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
        </>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
