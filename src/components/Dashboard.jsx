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
    setConfig((prevConfig) => ({
      ...prevConfig,
      [section]: {
        ...prevConfig[section],
        ...data,
      },
    }));
  };

  // Generate and download JSON file
  const generateJsonFile = () => {
    // Create a blob with the JSON data
    const jsonData = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Create a temporary link and trigger download
    const link = document.createElement("a");
    link.href = url;
    link.download = "sage-bitrix-config.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
