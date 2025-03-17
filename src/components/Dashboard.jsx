import { useState, useEffect } from "react";
import DatabaseConfig from "./DatabaseConfig";
import Bitrix24Config from "./Bitrix24Config";
import Companies from "./Companies";
import { invoke } from "@tauri-apps/api/core";

function Dashboard({ user, token, config, updateConfig, onLogout }) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [localConfig, setLocalConfig] = useState(config);

  // Update local config when props change
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  // Handle configuration updates
  const handleUpdateConfig = (section, data) => {
    let newConfig = { ...localConfig };

    if (section === "companies") {
      // For companies, directly update the array instead of nesting it
      newConfig.companies = data.companies || data;
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
      if (!localConfig?.database?.dbHost) missingFields.push("Database Host");
      if (!localConfig?.database?.dbDatabase)
        missingFields.push("Database Name");
      if (!localConfig?.database?.dbUsername)
        missingFields.push("Database Username");
      if (!localConfig?.database?.dbPassword)
        missingFields.push("Database Password");

      // Check Bitrix config
      if (!localConfig?.bitrix24?.apiTenant)
        missingFields.push("Bitrix24 API Tenant");

      // Check if companies exist
      if (!localConfig?.companies?.length)
        missingFields.push("Company Mappings");

      // If any fields are missing, alert the user
      if (missingFields.length > 0) {
        alert(
          `Please complete the following fields before saving the configuration:\n\n${missingFields.join(
            "\n"
          )}`
        );
        setIsGenerating(false);
        return;
      }

      // Map configuration to expected JSON structure
      const configJson = {
        CodigoCliente: user.username,
        DB: {
          DB_Host: localConfig.database.dbHost,
          DB_Host_Sage: localConfig.database.dbHostSage,
          DB_Port: localConfig.database.dbPort,
          DB_Database: localConfig.database.dbDatabase,
          DB_Username: localConfig.database.dbUsername,
          DB_Password: localConfig.database.dbPassword,
          IdLlicencia: localConfig.database.license,
        },
        Bitrix24: {
          API_Tenant: localConfig.bitrix24.apiTenant,
        },
        Empresas: localConfig.companies.map((company) => ({
          EmpresaBitrix: company.bitrixCompany,
          EmpresaSage: company.sageCompanyCode,
        })),
      };

      // Convert to JSON string
      const jsonString = JSON.stringify(configJson, null, 4);

      // Define output path
      const outputPath = `config-${user.username}`;

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
    switch (activeSection) {
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
              Welcome to Sage-Bitrix Configurator, {user.username}
            </h2>
            <p className="text-onyx-500 max-w-lg text-center">
              This tool helps you configure the connection between Sage 200c and
              Bitrix24 CRM. Use the options below to set up your configuration.
            </p>

            {/* User profile information if available */}
            {user.profile && (
              <div className="bg-onyx-100 p-4 rounded-lg max-w-lg w-full">
                <h3 className="text-lg font-semibold mb-2">Your Profile</h3>
                <p>User Type: {user.userType || "Standard"}</p>
                {/* Display other relevant user information here */}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
              <ConfigCard
                title="Database Configuration"
                description="Set up Sage 200c database connection details"
                icon="💾"
                onClick={() => setActiveSection("database")}
              />
              <ConfigCard
                title="Bitrix24 Configuration"
                description="Configure Bitrix24 CRM integration settings"
                icon="🔌"
                onClick={() => setActiveSection("bitrix24")}
              />
              <ConfigCard
                title="Company Mappings"
                description="Map Bitrix24 companies to Sage company codes"
                icon="🏢"
                onClick={() => setActiveSection("companies")}
              />
            </div>

            <div className="mt-8 flex flex-col items-center space-y-4">
              <button
                onClick={saveConfiguration}
                disabled={isGenerating}
                className={`bg-onyx-500 hover:bg-onyx-600 text-brand-white font-bold py-3 px-6 rounded focus:outline-none focus:shadow-outline transition duration-300 ${
                  isGenerating ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isGenerating ? "Saving..." : "Save Configuration"}
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
                      File saved to:{" "}
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
            <h1 className="text-xl font-bold">Sage-Bitrix Configurator</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-brand-white">Welcome, {user.username}</span>
            <button
              onClick={onLogout}
              className="bg-onyx-600 hover:bg-onyx-700 text-brand-white px-3 py-1 rounded transition duration-300"
            >
              Logout
            </button>
          </div>
          <nav className="hidden md:flex space-x-4">
            <NavLink
              active={activeSection === "dashboard"}
              onClick={() => setActiveSection("dashboard")}
            >
              Dashboard
            </NavLink>
            <NavLink
              active={activeSection === "database"}
              onClick={() => setActiveSection("database")}
            >
              Database
            </NavLink>
            <NavLink
              active={activeSection === "bitrix24"}
              onClick={() => setActiveSection("bitrix24")}
            >
              Bitrix24
            </NavLink>
            <NavLink
              active={activeSection === "companies"}
              onClick={() => setActiveSection("companies")}
            >
              Companies
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">{renderContent()}</main>

      {/* Footer */}
      <footer className="bg-onyx-200 p-4 text-center text-onyx-700 text-sm">
        &copy;2025 Bussiness Tic Consultoria. All rights reserved.
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
