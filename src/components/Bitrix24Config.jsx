import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

function Bitrix24Config({ config, updateConfig }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(
    config || {
      apiTenant: "",
      packEmpresa: false,
    }
  );

  // Update local state when props change
  useEffect(() => {
    setFormData(config || { apiTenant: "", packEmpresa: false });
  }, [config]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Use checked for checkboxes, value for other inputs
    const inputValue = type === "checkbox" ? checked : value;

    const updatedData = {
      ...formData,
      [name]: inputValue,
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
          {t("bitrix24.title")}
        </h2>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <label
              htmlFor="apiTenant"
              className="block text-onyx-600 text-sm font-bold mb-2"
            >
              {t("bitrix24.apiTenant")}
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
        <div className="mt-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="packEmpresa"
              name="packEmpresa"
              checked={formData.packEmpresa || false}
              onChange={handleChange}
              className="w-4 h-4 text-onyx-600 border-onyx-300 rounded focus:ring-onyx-500"
            />
            <label
              htmlFor="packEmpresa"
              className="ml-2 block text-onyx-600 text-sm font-medium"
            >
              {t("bitrix24.packEmpresa")}
            </label>
          </div>
          <p className="mt-1 text-sm text-onyx-500">
            {t("bitrix24.packEmpresaHelp")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Bitrix24Config;
