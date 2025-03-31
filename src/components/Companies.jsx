import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

function Companies({ config, updateConfig }) {
  const { t } = useTranslation();
  const [companies, setCompanies] = useState(
    Array.isArray(config?.companies) ? config.companies : []
  );
  const [newCompany, setNewCompany] = useState({
    bitrixCompany: "",
    sageCompanyCode: "",
  });

  // Update local state when props change
  useEffect(() => {
    if (Array.isArray(config?.companies)) {
      setCompanies(config.companies);
    }
  }, [config]);

  // Handle input changes for new company
  const handleNewCompanyChange = (e) => {
    const { name, value } = e.target;
    setNewCompany({
      ...newCompany,
      [name]: value,
    });
  };

  // Add new company mapping - now updates parent state immediately
  const handleAddCompany = () => {
    // Validate inputs
    if (!newCompany.bitrixCompany || !newCompany.sageCompanyCode) {
      alert(t("companies.validateInputs"));
      return;
    }

    // Add new company to list
    const updatedCompanies = [...companies, { ...newCompany }];
    setCompanies(updatedCompanies);

    // Update parent component with the array directly
    updateConfig(updatedCompanies);

    // Reset form
    setNewCompany({
      bitrixCompany: "",
      sageCompanyCode: "",
    });
  };

  // Remove company mapping - now updates parent state immediately
  const handleRemoveCompany = (index) => {
    const updatedCompanies = companies.filter((_, i) => i !== index);
    setCompanies(updatedCompanies);
    updateConfig(updatedCompanies);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-brand-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-onyx-600">
          {t("companies.title")}
        </h2>

        {/* Existing companies */}
        {companies.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-onyx-500">
              {t("companies.existingMappings")}
            </h3>
            <div className="bg-onyx-100 rounded-lg p-4">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-3 text-onyx-600">
                      {t("companies.bitrixCompany")}
                    </th>
                    <th className="text-left py-2 px-3 text-onyx-600">
                      {t("companies.sageCompanyCode")}
                    </th>
                    <th className="text-right py-2 px-3 text-onyx-600">
                      {t("companies.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company, index) => (
                    <tr key={index} className="border-t border-onyx-200">
                      <td className="py-2 px-3 text-onyx-800">
                        {company.bitrixCompany}
                      </td>
                      <td className="py-2 px-3 text-onyx-800">
                        {company.sageCompanyCode}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveCompany(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          {t("companies.remove")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add new company mapping */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-onyx-500">
            {t("companies.addNewMapping")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="bitrixCompany"
                className="block text-onyx-600 text-sm font-bold mb-2"
              >
                {t("companies.bitrixCompany")}
              </label>
              <input
                type="text"
                id="bitrixCompany"
                name="bitrixCompany"
                value={newCompany.bitrixCompany}
                onChange={handleNewCompanyChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-onyx-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder={t("companies.enterBitrixName")}
              />
            </div>
            <div>
              <label
                htmlFor="sageCompanyCode"
                className="block text-onyx-600 text-sm font-bold mb-2"
              >
                {t("companies.sageCompanyCode")}
              </label>
              <input
                type="text"
                id="sageCompanyCode"
                name="sageCompanyCode"
                value={newCompany.sageCompanyCode}
                onChange={handleNewCompanyChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-onyx-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder={t("companies.enterSageCode")}
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={handleAddCompany}
              className="bg-onyx-400 hover:bg-onyx-500 text-brand-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
            >
              {t("companies.addCompany")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Companies;
