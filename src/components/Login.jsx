import { useState } from "react";

function Login() {
  const logoPath = "../../public/btic-logo.svg";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    // Clear error if validation passes
    setError("");

    // TODO: Handle login logic
    console.log("Login attempt with:", { username, password });

    // Call a function to authenticate
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-onyx-100">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="bg-brand-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4"
        >
          <div className="flex justify-center mb-4">
            <img 
              src={logoPath} 
              alt="BTC Logo" 
              className="h-20 w-auto" 
            />
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
            />
          </div>

          <div className="flex items-center justify-center">
            <button
              type="submit"
              className="bg-onyx-500 hover:bg-onyx-600 text-brand-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
            >
              Sign In
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
