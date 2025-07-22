import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import DatabaseConfig from "./DatabaseConfig";
import Bitrix24Config from "./Bitrix24Config";
import Companies from "./Companies";
import GeneralSettings from "./GeneralSettings";
import FieldMapping from "./FieldMapping";
import LanguageSwitcher from "./LanguageSwitcher";
import SimpleServiceStatusIndicator from "./SimpleServiceStatusIndicator";
import ServiceTestComponent from "./ServiceTestComponent";
import ConfigDebugPanel from "./ConfigDebugPanel";
import { invoke } from "@tauri-apps/api/core";

function Dashboard({
  user,
  token,
  config,
  configFromStorage,
  updateConfig,
  onLogout,
}) {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);

  // ✅ Función para obtener mapeos por defecto
  const getDefaultFieldMappings = () => [
    {
      bitrixFieldName: "UF_CRM_COMPANY_CATEGORIA",
      bitrixFieldType: "string",
      sageFieldName: "CodigoCategoriaCliente",
      sageFieldDescription: "Código de categoría del cliente",
      isActive: true,
      isMandatory: true
    },
    {
      bitrixFieldName: "UF_CRM_COMPANY_RAZON",
      bitrixFieldType: "string",
      sageFieldName: "RazonSocial",
      sageFieldDescription: "Razón social de la empresa",
      isActive: true,
      isMandatory: true
    },
    {
      bitrixFieldName: "UF_CRM_COMPANY_DIVISA",
      bitrixFieldType: "string",
      sageFieldName: "CodigoDivisa",
      sageFieldDescription: "Código de divisa",
      isActive: true,
      isMandatory: false
    },
    {
      bitrixFieldName: "UF_CRM_COMPANY_DOMICILIO",
      bitrixFieldType: "string",
      sageFieldName: "Domicilio",
      sageFieldDescription: "Dirección principal",
      isActive: true,
      isMandatory: false
    },
    {
      bitrixFieldName: "UF_CRM_COMPANY_TELEFONO",
      bitrixFieldType: "string",
      sageFieldName: "Telefono",
      sageFieldDescription: "Número de teléfono",
      isActive: true,
      isMandatory: false
    },
    {
      bitrixFieldName: "UF_CRM_COMPANY_EMAIL",
      bitrixFieldType: "string",
      sageFieldName: "EMail1",
      sageFieldDescription: "Correo electrónico principal",
      isActive: true,
      isMandatory: false
    }
  ];

  // ✅ Mejorar inicialización del estado local
  const [localConfig, setLocalConfig] = useState(() => {
    const baseConfig = {
      ...config,
      clientCode: config?.clientCode || user.username,
      fieldMappings: config?.fieldMappings || [],
    };
    
    // Si no hay fieldMappings, crear los mapeos por defecto
    if (!baseConfig.fieldMappings || baseConfig.fieldMappings.length === 0) {
      baseConfig.fieldMappings = getDefaultFieldMappings();
    }
    
    return baseConfig;
  });

  // Check if user is admin
  const isAdmin = user.userType === "admin";

  // ✅ Mejorar useEffect para sincronización
  useEffect(() => {
    console.log("Dashboard: Config updated", config); // Debug log
    
    const newConfig = {
      ...config,
      clientCode: config?.clientCode || user.username,
      fieldMappings: config?.fieldMappings?.length > 0 ? config.fieldMappings : getDefaultFieldMappings(),
    };
    
    // Solo actualizar si realmente hay cambios
    const configChanged = JSON.stringify(newConfig) !== JSON.stringify(localConfig);
    if (configChanged) {
      console.log("Dashboard: Updating local config", newConfig); // Debug log
      setLocalConfig(newConfig);
    }
  }, [config, user.username]);

  // ✅ Mejorar handleUpdateConfig para mejor debugging
  const handleUpdateConfig = (section, data) => {
    console.log(`Dashboard: Updating ${section} with:`, data); // Debug log
    
    let newConfig = { ...localConfig };

    if (section === "companies") {
      newConfig.companies = Array.isArray(data) ? data : (data.companies || []);
    } else if (section === "fieldMappings") {
      newConfig.fieldMappings = Array.isArray(data) ? data : [];
      console.log("Dashboard: Field mappings updated to:", newConfig.fieldMappings); // Debug log
    } else if (section === "general") {
      newConfig = {
        ...newConfig,
        ...data,
      };
    } else {
      newConfig[section] = {
        ...newConfig[section],
        ...data,
      };
    }

    console.log("Dashboard: New config state:", newConfig); // Debug log
    
    setLocalConfig(newConfig);
    updateConfig(newConfig);
  };

  // ✅ Mejorar saveConfiguration con validación y debugging
  const saveConfiguration = async () => {
    console.log("Dashboard: Starting save configuration with:", localConfig); // Debug log
    
    setIsGenerating(true);
    setGenerationResult(null);

    try {
      // ✅ Asegurar que fieldMappings existe y tiene contenido
      const finalFieldMappings = localConfig.fieldMappings && localConfig.fieldMappings.length > 0 
        ? localConfig.fieldMappings 
        : getDefaultFieldMappings();

      console.log("Dashboard: Final field mappings for save:", finalFieldMappings); // Debug log

      // Validate configuration data
      const missingFields = [];

      // Check database config
      if (!localConfig?.database?.dbHost) missingFields.push(t("database.dbHost"));
      if (!localConfig?.database?.dbDatabase) missingFields.push(t("database.dbDatabase"));
      if (!localConfig?.database?.dbUsername) missingFields.push(t("database.dbUsername"));
      if (!localConfig?.database?.dbPassword) missingFields.push(t("database.dbPassword"));

      // Check Bitrix config - only if user is admin
      if (isAdmin && !localConfig?.bitrix24?.apiTenant) missingFields.push(t("bitrix24.apiTenant"));

      // Check if companies exist
      if (!localConfig?.companies?.length) missingFields.push(t("dashboard.companies"));

      // Check client code
      if (!localConfig?.clientCode) missingFields.push(t("general.clientCode"));

      // ✅ Validar que hay field mappings
      if (!finalFieldMappings.length) {
        console.warn("Dashboard: No field mappings found, using defaults");
      }

      if (missingFields.length > 0) {
        alert(`${t("dialogs.missingFields")}\n\n${missingFields.join("\n")}`);
        setIsGenerating(false);
        return;
      }

      // ✅ Map configuration to expected JSON structure con fieldMappings incluidos
      const configJson = {
        CodigoCliente: localConfig.clientCode || user.username,
        DB: {
          DB_Host: localConfig.database.dbHost,
          DB_Host_Sage: localConfig.database.dbHostSage,
          DB_Port: localConfig.database.dbPort,
          DB_Database: localConfig.database.dbDatabase,
          DB_Username: localConfig.database.dbUsername,
          DB_Password: localConfig.database.dbPassword,
          IdLlicencia: localConfig.database.license,
        },
        Bitrix24: isAdmin ? {
          API_Tenant: localConfig.bitrix24.apiTenant,
          pack_empresa: Boolean(localConfig.bitrix24.packEmpresa),
        } : null,
        Empresas: (localConfig.companies || []).map((company) => ({
          EmpresaBitrix: company.bitrixCompany,
          EmpresaSage: company.sageCompanyCode,
        })),
        // ✅ Asegurar que FieldMappings siempre se incluye
        FieldMappings: finalFieldMappings
      };

      // Remove null properties
      if (!configJson.Bitrix24) {
        delete configJson.Bitrix24;
      }

      console.log("Dashboard: Final config JSON to save:", configJson); // Debug log

      // Convert to JSON string
      const jsonString = JSON.stringify(configJson, null, 2);
      console.log("Dashboard: JSON string to encrypt:", jsonString); // Debug log

      // Define output path
      const outputPath = `config`;

      // Call the Rust encryption function via Tauri
      const result = await invoke("encrypt_json", {
        jsonData: jsonString,
        outputPath: outputPath,
        charKey: "T",
      });

      console.log("Dashboard: Encryption result:", result); // Debug log

      // Show success message
      setGenerationResult({
        success: true,
        message: result.message,
        filePath: result.file_path,
      });

    } catch (error) {
      console.error("Dashboard: Error saving configuration file:", error);
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
      return renderContent();
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
      case "fieldMapping":
        return (
          <FieldMapping
            config={localConfig}
            updateConfig={(data) => handleUpdateConfig("fieldMappings", data)}
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

            {/* ✅ Testing button for development */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={() => {
                  console.log("=== CONFIG TEST ===");
                  console.log("Local config:", localConfig);
                  console.log("Field mappings:", localConfig.fieldMappings);
                  console.log("Field mappings count:", localConfig.fieldMappings?.length);
                  console.log("=== END TEST ===");
                }}
                className="bg-red-500 text-white p-2 rounded mb-4"
              >
                🧪 Test Config State
              </button>
            )}

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
              <ConfigCard
                title={t("dashboard.general")}
                description={t("dashboard.generalDescription")}
                icon="⚙️"
                onClick={() => setActiveSection("general")}
              />
              <ConfigCard
                title={t("dashboard.database")}
                description={t("dashboard.databaseDescription")}
                icon="🗄️"
                onClick={() => setActiveSection("database")}
              />
              {isAdmin && (
                <ConfigCard
                  title={t("dashboard.bitrix24")}
                  description={t("dashboard.bitrix24Description")}
                  icon="🔗"
                  onClick={() => setActiveSection("bitrix24")}
                />
              )}
              <ConfigCard
                title={t("dashboard.companies")}
                description={t("dashboard.companiesDescription")}
                icon="🏢"
                onClick={() => setActiveSection("companies")}
              />
              <ConfigCard
                title={t("fieldMapping.title")}
                description={t("dashboard.fieldMappingDescription")}
                icon="🔄"
                onClick={() => setActiveSection("fieldMapping")}
              />
            </div>

            <div className="mt-8">
              <button
                onClick={saveConfiguration}
                disabled={isGenerating}
                className={`px-6 py-3 rounded-lg font-bold transition duration-300 ${
                  isGenerating
                    ? "bg-onyx-300 text-onyx-500 cursor-not-allowed"
                    : "bg-onyx-400 hover:bg-onyx-500 text-brand-white"
                }`}
              >
                {isGenerating
                  ? t("dashboard.saving")
                  : t("dashboard.saveConfiguration")}
              </button>
            </div>

            {/* Service Status and Communication Test - Only in Dashboard */}
            <div className="mt-6 flex items-center space-x-6">
              <SimpleServiceStatusIndicator />
              <ServiceTestComponent />
            </div>

            {generationResult && (
              <div
                className={`mt-4 p-4 rounded-lg max-w-lg w-full ${
                  generationResult.success
                    ? "bg-green-100 border border-green-400 text-green-700"
                    : "bg-red-100 border border-red-400 text-red-700"
                }`}
              >
                <p className="font-semibold">{generationResult.message}</p>
                {generationResult.filePath && (
                  <p className="text-sm mt-2">
                    {t("dashboard.fileSavedTo")} {generationResult.filePath}
                  </p>
                )}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-onyx-100 flex flex-col">
      {/* Header */}
      <header className="bg-onyx-400 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-brand-white">
              {t("app.title")}
            </h1>
            <nav className="hidden md:flex space-x-2">
              <NavLink
                active={activeSection === "dashboard"}
                onClick={() => setActiveSection("dashboard")}
              >
                {t("dashboard.home")}
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
              <NavLink
                active={activeSection === "fieldMapping"}
                onClick={() => setActiveSection("fieldMapping")}
              >
                {t("fieldMapping.title")}
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <button
              onClick={onLogout}
              className="bg-red-500 hover:bg-red-600 text-brand-white px-4 py-2 rounded transition duration-300"
            >
              {t("dashboard.logout")}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-onyx-200 p-4 text-center text-onyx-700 text-sm">
        {t("footer.copyright")}
      </footer>

      {/* ✅ Debug Panel for development */}
      {process.env.NODE_ENV === 'development' && (
        <ConfigDebugPanel 
          config={config} 
          localConfig={localConfig} 
          user={user} 
        />
      )}
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