import { useState, useEffect } from "react";

function Bitrix24Config({ config, updateConfig }) {
  const [formData, setFormData] = useState(
    config || {
      apiTenant: "",
    }
  );

  // Update local state when props change
  useEffect(() => {
    setFormData(config || { apiTenant: "" });
  }, [config]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Save changes
  const handleSubmit = (e) => {
    e.preventDefault();
    updateConfig(formData);
    alert("Bitrix24 configuration saved!");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-brand-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-onyx-600">
          Bitrix24 Configuration
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label
                htmlFor="apiTenant"
                className="block text-onyx-600 text-sm font-bold mb-2"
              >
                API Tenant
              </label>
              <input
                type="text"
                id="apiTenant"
                name="apiTenant"
                value={formData.apiTenant || ""}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-onyx-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="https://your-company.bitrix24.com"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end mt-6">
            <button
              type="submit"
              className="bg-onyx-500 hover:bg-onyx-600 text-brand-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Bitrix24Config;
