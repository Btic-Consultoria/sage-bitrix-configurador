import { useState, useEffect } from "react";

function Bitrix24Config({ config, updateConfig }) {
  const [formData, setFormData] = useState(config);

  // Update local state when props change
  useEffect(() => {
    setFormData(config);
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
            <p className="text-onyx-500">
              Bitrix24 configuration options will be implemented here. Please
              provide the required field details.
            </p>
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

      {/* Preview Section */}
      <div className="mt-8 bg-onyx-200 rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4 text-onyx-600">
          Configuration Preview
        </h3>
        <pre className="bg-onyx-100 p-4 rounded overflow-x-auto">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default Bitrix24Config;
