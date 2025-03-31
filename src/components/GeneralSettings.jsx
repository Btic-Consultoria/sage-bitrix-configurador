import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

function GeneralSettings({ config, updateConfig }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    clientCode: config.clientCode || "",
  });

  // Update local state when props change
  useEffect(() => {
    setFormData({
      clientCode: config.clientCode || "",
    });
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
          {t("general.title")}
        </h2>

        <div className="mb-4">
          <label
            htmlFor="clientCode"
            className="block text-onyx-600 text-sm font-bold mb-2"
          >
            {t("general.clientCode")}
          </label>
          <input
            type="text"
            id="clientCode"
            name="clientCode"
            value={formData.clientCode}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-onyx-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder={t("general.clientCode")}
          />
          <p className="mt-1 text-sm text-onyx-500">
            {t("general.clientCodeHelp")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default GeneralSettings;
