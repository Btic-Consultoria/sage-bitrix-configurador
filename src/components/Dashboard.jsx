import { useState } from "react";
import DatabaseConfig from "./DatabaseConfig";
import Bitrix24Config from "./Bitrix24Config";
import Companies from "./Companies";

function Dashboard({ user, onLogout }) {
  const [activeSection, setActiveSection] = useState("dashboard");
  // This will store our configuration data
  const [config, setConfig] = useState({
    database: {
      dbHost: "",
      dbHostSage: "",
      dbPort: "",
      dbDatabase: "",
      dbUsername: "",
      dbPassword: "",
      license: "",
    },
    bitrix24: {
      apiTenant: "",
    },
    companies: [],
  });

  // Handle configuration updates
  const updateConfig = (section, data) => {
    if (section === "companies") {
      // For companies, we want to replace the entire companies array
      setConfig((prevConfig) => ({
        ...prevConfig,
        companies: data.companies || [],
      }));
    } else {
      // For other sections, merge the data
      setConfig((prevConfig) => ({
        ...prevConfig,
        [section]: {
          ...prevConfig[section],
          ...data,
        },
      }));
    }
  };

  // Generate and download JSON file
  const generateJsonFile = () => {
    // Validate configuration data
    const missingFields = [];

    // Check database config
    if (!config.database.dbHost) missingFields.push("Database Host");
    if (!config.database.dbDatabase) missingFields.push("Database Name");
    if (!config.database.dbUsername) missingFields.push("Database Username");
    if (!config.database.dbPassword) missingFields.push("Database Password");

    // Check Bitrix config
    if (!config.bitrix24.apiTenant) missingFields.push("Bitrix24 API Tenant");

    // Check if companies exist
    if (config.companies.length === 0) missingFields.push("Company Mappings");

    // If any fields are missing, alert the user
    if (missingFields.length > 0) {
      alert(
        `Please complete the following fields before generating the configuration file:\n\n${missingFields.join(
          "\n"
        )}`
      );
      return;
    }

    // Map configuration to expected JSON structure - matches exactly the example
    const configJson = {
      CodigoCliente: user.username,
      Db: {
        DB_Host: config.database.dbHost,
        DB_Host_Sage: config.database.dbHostSage,
        DB_Port: config.database.dbPort,
        DB_Database: config.database.dbDatabase,
        DB_Username: config.database.dbUsername,
        DB_Password: config.database.dbPassword,
        IdLlicencia: config.database.license,
      },
      Bitrix24: {
        API_Tenant: config.bitrix24.apiTenant,
      },
      Empresas: config.companies.map((company) => ({
        EmpresaBitrix: company.bitrixCompany,
        EmpresaSage: company.sageCompanyCode,
      })),
    };

    // Convert to JSON string with pretty formatting
    const jsonString = JSON.stringify(configJson, null, 4);

    // Create a blob and download the file
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `config-${user.username}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert("Configuration file generated successfully!");
  };

  // Render the appropriate content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case "database":
        return (
          <DatabaseConfig
            config={config.database}
            updateConfig={(data) => updateConfig("database", data)}
          />
        );
      case "bitrix24":
        return (
          <Bitrix24Config
            config={config.bitrix24}
            updateConfig={(data) => updateConfig("bitrix24", data)}
          />
        );
      case "companies":
        return (
          <Companies
            config={config}
            updateConfig={(data) => updateConfig("companies", data)}
          />
        );
      default:
        return (
          <div className="flex flex-col items-center space-y-8 py-8">
            <h2 className="text-2xl font-bold text-onyx-600">
              Welcome to Sage-Bitrix Configurator
            </h2>
            <p className="text-onyx-500 max-w-lg text-center">
              This tool helps you configure the connection between Sage 200c and
              Bitrix24 CRM. Use the options below to set up your configuration.
            </p>

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

            <div className="mt-8">
              <button
                onClick={generateJsonFile}
                className="bg-onyx-500 hover:bg-onyx-600 text-brand-white font-bold py-3 px-6 rounded focus:outline-none focus:shadow-outline transition duration-300"
              >
                Generate Configuration File
              </button>
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
