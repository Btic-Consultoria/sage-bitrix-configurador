import { useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Handle successful login
  const handleLogin = (username) => {
    setUser({ username });
    setIsAuthenticated(true);
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <div className="App">
      {isAuthenticated ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
