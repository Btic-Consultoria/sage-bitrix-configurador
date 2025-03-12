import { useState, useEffect } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for saved token on startup
  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("user_data");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }

    setIsLoading(false);
  }, []);

  // Handle successful login
  const handleLogin = (userData, authToken) => {
    // Save token and user data
    localStorage.setItem("auth_token", authToken);
    localStorage.setItem("user_data", JSON.stringify(userData));

    // Update state
    setToken(authToken);
    setUser(userData);
    setIsAuthenticated(true);
  };

  // Handle logout
  const handleLogout = () => {
    // Clear stored data
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");

    // Reset state
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
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
        <Dashboard user={user} token={token} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
