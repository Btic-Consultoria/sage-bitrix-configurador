import { useState, useEffect } from "react";

function DatabaseConfig({ config, updateConfig }) {
  const [formData, setFormData] = useState(config);
  const [showPassword, setShowPassword] = useState(false);

  // Update local state when props change
  useEffect(() => {
    setFormData(config);
  }, [config]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedData = {
      ...formData,
      [name]: value,
    };

    // Update local state
    setFormData(updatedData);

    // Update parent state immediately
    updateConfig(updatedData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-brand-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-onyx-600">
          Database Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* DB Host */}
          <div className="col-span-1">
            <label
              htmlFor="dbHost"
              className="block text-onyx-600 text-sm font-bold mb-2"
            >
              DB Host
            </label>
            <input
              type="text"
              id="dbHost"
              name="dbHost"
              value={formData.dbHost}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-onyx-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="e.g., localhost or 127.0.0.1"
            />
          </div>

          {/* DB Host Sage */}
          <div className="col-span-1">
            <label
              htmlFor="dbHostSage"
              className="block text-onyx-600 text-sm font-bold mb-2"
            >
              DB Host Sage
            </label>
            <input
              type="text"
              id="dbHostSage"
              name="dbHostSage"
              value={formData.dbHostSage}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-onyx-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="e.g., sage.example.com"
            />
          </div>

          {/* DB Port */}
          <div className="col-span-1">
            <label
              htmlFor="dbPort"
              className="block text-onyx-600 text-sm font-bold mb-2"
            >
              DB Port
            </label>
            <input
              type="text"
              id="dbPort"
              name="dbPort"
              value={formData.dbPort}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-onyx-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="e.g., 1433"
            />
          </div>

          {/* DB Database */}
          <div className="col-span-1">
            <label
              htmlFor="dbDatabase"
              className="block text-onyx-600 text-sm font-bold mb-2"
            >
              DB Database
            </label>
            <input
              type="text"
              id="dbDatabase"
              name="dbDatabase"
              value={formData.dbDatabase}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-onyx-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="e.g., sage200"
            />
          </div>

          {/* DB Username */}
          <div className="col-span-1">
            <label
              htmlFor="dbUsername"
              className="block text-onyx-600 text-sm font-bold mb-2"
            >
              DB Username
            </label>
            <input
              type="text"
              id="dbUsername"
              name="dbUsername"
              value={formData.dbUsername}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-onyx-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="e.g., db_user"
            />
          </div>

          {/* DB Password */}
          <div className="col-span-1">
            <label
              htmlFor="dbPassword"
              className="block text-onyx-600 text-sm font-bold mb-2"
            >
              DB Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="dbPassword"
                name="dbPassword"
                value={formData.dbPassword}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-onyx-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter database password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* License */}
          <div className="col-span-2">
            <label
              htmlFor="license"
              className="block text-onyx-600 text-sm font-bold mb-2"
            >
              License
            </label>
            <input
              type="text"
              id="license"
              name="license"
              value={formData.license}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-onyx-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter license key"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DatabaseConfig;
