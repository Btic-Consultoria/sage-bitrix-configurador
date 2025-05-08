import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import DatabaseConfig from "./DatabaseConfig";
import Bitrix24Config from "./Bitrix24Config";
import Companies from "./Companies";
import GeneralSettings from "./GeneralSettings";
import LanguageSwitcher from "./LanguageSwitcher";
import SimpleServiceStatusIndicator from "./SimpleServiceStatusIndicator";
import ServiceTestComponent from "./ServiceTestComponent";
import { invoke } from "@tauri-apps/api/core";

function Dashboard({
  user,
  token,
  config,
  configFromStorage,
  updateConfig,
  onLogout,
}) {
  const { t } = useTranslation(); // Add this hook
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [localConfig, setLocalConfig] = useState({
    ...config,
    // Set default clientCode to username if not specified
    clientCode: config?.clientCode || user.username,
  });

  // Check if user is admin
  const isAdmin = user.userType === "admin";

  // Update local config when props change
  useEffect(() => {
    setLocalConfig({
      ...config,
      clientCode: config?.clientCode || user.username,
    });
  }, [config, user.username]);

  // Handle configuration updates
  const handleUpdateConfig = (section, data) => {
    let newConfig = { ...localConfig };

    if (section === "companies") {
      // For companies, directly update the array instead of nesting it
      newConfig.companies = data.companies || data;
    } else if (section === "general") {
      // For general settings, update top-level properties
      newConfig = {
        ...newConfig,
        ...data,
      };
    } else {
      // For other sections, merge with existing data
      newConfig[section] = {
        ...newConfig[section],
        ...data,
      };
    }

    setLocalConfig(newConfig);
    updateConfig(newConfig);
  };

  // Save configuration to an encrypted file
  const saveConfiguration = async () => {
    // Reset state
    setIsGenerating(true);
    setGenerationResult(null);

    try {
      // Validate configuration data
      const missingFields = [];

      // Check database config
      if (!localConfig?.database?.dbHost)
        missingFields.push(t("database.dbHost"));
      if (!localConfig?.database?.dbDatabase)
        missingFields.push(t("database.dbDatabase"));
      if (!localConfig?.database?.dbUsername)
        missingFields.push(t("database.dbUsername"));
      if (!localConfig?.database?.dbPassword)
        missingFields.push(t("database.dbPassword"));

      // Check Bitrix config - only if user is admin
      if (isAdmin && !localConfig?.bitrix24?.apiTenant)
        missingFields.push(t("bitrix24.apiTenant"));

      // Check if companies exist
      if (!localConfig?.companies?.length)
        missingFields.push(t("dashboard.companies"));

      // Check client code
      if (!localConfig?.clientCode) missingFields.push(t("general.clientCode"));

      // If any fields are missing, alert the user
      if (missingFields.length > 0) {
        alert(`${t("dialogs.missingFields")}\n\n${missingFields.join("\n")}`);
        setIsGenerating(false);
        return;
      }

      // Map configuration to expected JSON structure
      const configJson = {
        CodigoCliente: localConfig.clientCode || user.username, // Use custom client code or fallback to username
        DB: {
          DB_Host: localConfig.database.dbHost,
          DB_Host_Sage: localConfig.database.dbHostSage,
          DB_Port: localConfig.database.dbPort,
          DB_Database: localConfig.database.dbDatabase,
          DB_Username: localConfig.database.dbUsername,
          DB_Password: localConfig.database.dbPassword,
          IdLlicencia: localConfig.database.license,
        },
        Bitrix24: isAdmin
          ? {
              API_Tenant: localConfig.bitrix24.apiTenant,
              pack_empresa: Boolean(localConfig.bitrix24.packEmpresa),
            }
          : null,
        Empresas: localConfig.companies.map((company) => ({
          EmpresaBitrix: company.bitrixCompany,
          EmpresaSage: company.sageCompanyCode,
        })),
      };

      // Remove null properties
      if (!configJson.Bitrix24) {
        delete configJson.Bitrix24;
      }

      // Convert to JSON string
      const jsonString = JSON.stringify(configJson, null, 4);

      // Define output path
      const outputPath = `config`;

      // Call the Rust encryption function via Tauri
      const result = await invoke("encrypt_json", {
        jsonData: jsonString,
        outputPath: outputPath,
        charKey: "T",
      });

      // Show success message
      setGenerationResult({
        success: true,
        message: result.message,
        filePath: result.file_path,
      });
    } catch (error) {
      // Show error message
      console.error("Error saving configuration file:", error);
      setGenerationResult({
        success: false,
        message: `Error: ${error.toString()}`,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Render the appropriate content based on active section
  const renderContent = () => {
    // If user is not admin and trying to access bitrix24 section, redirect to dashboard
    if (activeSection === "bitrix24" && !isAdmin) {
      setActiveSection("dashboard");
      return renderContent(); // Recursively call to render dashboard content
    }

    switch (activeSection) {
      case "general":
        return (
          <GeneralSettings
            config={localConfig}
            updateConfig={(data) => handleUpdateConfig("general", data)}
          />
        );
      case "database":
        return (
          <DatabaseConfig
            config={localConfig.database}
            updateConfig={(data) => handleUpdateConfig("database", data)}
          />
        );
      case "bitrix24":
        return (
          <Bitrix24Config
            config={localConfig.bitrix24}
            updateConfig={(data) => handleUpdateConfig("bitrix24", data)}
          />
        );
      case "companies":
        return (
          <Companies
            config={localConfig}
            updateConfig={(data) => handleUpdateConfig("companies", data)}
          />
        );
      default:
        return (
          <div className="flex flex-col items-center space-y-8 py-8">
            <h2 className="text-2xl font-bold text-onyx-600">
              {t("app.welcome", { username: user.username })}
            </h2>
            <p className="text-onyx-500 max-w-lg text-center">
              {t("dashboard.welcome")}
            </p>

            {/* User profile information if available */}
            {user.profile && (
              <div className="bg-onyx-100 p-4 rounded-lg max-w-lg w-full">
                <h3 className="text-lg font-semibold mb-2">
                  {t("dashboard.yourProfile")}
                </h3>
                <p>
                  {t("dashboard.userType")}: {user.userType || "Standard"}
                </p>
                <p>
                  {t("dashboard.company")}: {user.company || "N/A"}
                </p>
              </div>
            )}

            {configFromStorage && (
              <div className="bg-green-100 border border-green-400 text-green-700 p-4 rounded-lg max-w-lg w-full">
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>{t("dashboard.configLoaded")}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
              <ConfigCard
                title={t("general.title")}
                description={t("general.clientCodeHelp")}
                icon="⚙️"
                onClick={() => setActiveSection("general")}
              />
              <ConfigCard
                title={t("database.title")}
                description={t("database.dbHost")}
                icon="💾"
                onClick={() => setActiveSection("database")}
              />
              {isAdmin && (
                <ConfigCard
                  title={t("bitrix24.title")}
                  description={t("bitrix24.apiTenant")}
                  icon="🔌"
                  onClick={() => setActiveSection("bitrix24")}
                />
              )}
              <ConfigCard
                title={t("companies.title")}
                description={t("companies.addNewMapping")}
                icon="🏢"
                onClick={() => setActiveSection("companies")}
              />
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold text-onyx-600 mb-4">
                {t("dashboard.serviceStatus", "Service Status")}
              </h3>
              <SimpleServiceStatusIndicator />
              <div className="mt-4">
                <ServiceTestComponent />
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center space-y-4">
              <button
                onClick={saveConfiguration}
                disabled={isGenerating}
                className={`bg-onyx-500 hover:bg-onyx-600 text-brand-white font-bold py-3 px-6 rounded focus:outline-none focus:shadow-outline transition duration-300 ${
                  isGenerating ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isGenerating
                  ? t("dashboard.saving")
                  : t("dashboard.saveConfiguration")}
              </button>

              {generationResult && (
                <div
                  className={`mt-4 p-4 rounded-lg ${
                    generationResult.success
                      ? "bg-green-100 border border-green-400 text-green-700"
                      : "bg-red-100 border border-red-400 text-red-700"
                  }`}
                >
                  <p>{generationResult.message}</p>
                  {generationResult.success && generationResult.filePath && (
                    <p className="mt-2">
                      {t("dashboard.fileSavedTo")}{" "}
                      <span className="font-mono bg-onyx-100 px-2 py-1 rounded">
                        {generationResult.filePath}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-onyx-100">
      {/* Header */}
      <header className="bg-brand-black text-brand-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <img src="/btic-logo-black.svg" alt="BTC Logo" className="h-8" />
            <h1 className="text-xl font-bold">{t("app.title")}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <span className="text-brand-white">
              {t("app.welcome", { username: user.username })}
            </span>
            <button
              onClick={onLogout}
              className="bg-onyx-600 hover:bg-onyx-700 text-brand-white px-3 py-1 rounded transition duration-300"
            >
              {t("dialogs.logout")}
            </button>
          </div>
          <nav className="hidden md:flex space-x-4">
            <NavLink
              active={activeSection === "dashboard"}
              onClick={() => setActiveSection("dashboard")}
            >
              {t("dashboard.dashboard")}
            </NavLink>
            <NavLink
              active={activeSection === "general"}
              onClick={() => setActiveSection("general")}
            >
              {t("dashboard.general")}
            </NavLink>
            <NavLink
              active={activeSection === "database"}
              onClick={() => setActiveSection("database")}
            >
              {t("dashboard.database")}
            </NavLink>
            {isAdmin && (
              <NavLink
                active={activeSection === "bitrix24"}
                onClick={() => setActiveSection("bitrix24")}
              >
                {t("dashboard.bitrix24")}
              </NavLink>
            )}
            <NavLink
              active={activeSection === "companies"}
              onClick={() => setActiveSection("companies")}
            >
              {t("dashboard.companies")}
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">{renderContent()}</main>

      {/* Footer */}
      <footer className="bg-onyx-200 p-4 text-center text-onyx-700 text-sm">
        {t("footer.copyright")}
      </footer>
    </div>
  );
}

// Helper Components
function NavLink({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded transition duration-300 ${
        active
          ? "bg-onyx-500 text-brand-white"
          : "text-brand-white hover:bg-onyx-700"
      }`}
    >
      {children}
    </button>
  );
}

function ConfigCard({ title, description, icon, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-brand-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300 cursor-pointer"
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-onyx-600 mb-2">{title}</h3>
      <p className="text-onyx-500">{description}</p>
    </div>
  );
}

export default Dashboard;
