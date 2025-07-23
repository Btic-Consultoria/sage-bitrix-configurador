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
import BitrixFieldService from "../services/BitrixFieldService";

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

  // Estado local de configuración inicializado correctamente
  const [localConfig, setLocalConfig] = useState(() => {
    if (config) {
      return config;
    }
    return {
      clientCode: "",
      database: {
        dbHost: "",
        dbHostSage: "",
        dbPort: "1433",
        dbDatabase: "",
        dbUsername: "",
        dbPassword: "",
        license: "",
      },
      bitrix24: {
        apiTenant: "",
        packEmpresa: false,
      },
      companies: [],
      fieldMappings: [],
    };
  });

  // Verificar si el usuario es admin
  const isAdmin = user?.role === "admin";

  // ✅ Función para obtener mapeos por defecto en la nueva estructura
  const getDefaultFieldMappings = () => ({
    Company: [
      {
        bitrixFieldName: "UF_CRM_COMPANY_CATEGORIA",
        sageFieldName: "CodigoCategoriaCliente",
      },
      {
        bitrixFieldName: "UF_CRM_COMPANY_RAZON",
        sageFieldName: "RazonSocial",
      },
      {
        bitrixFieldName: "UF_CRM_COMPANY_DIVISA",
        sageFieldName: "CodigoDivisa",
      },
      {
        bitrixFieldName: "UF_CRM_COMPANY_DOMICILIO",
        sageFieldName: "Domicilio",
      },
      {
        bitrixFieldName: "UF_CRM_COMPANY_TELEFONO",
        sageFieldName: "Telefono",
      },
      {
        bitrixFieldName: "UF_CRM_COMPANY_EMAIL",
        sageFieldName: "EMail1",
      },
    ],
  });

  // ✅ Función para migrar estructura antigua a nueva
  const migrateFieldMappingsToNewStructure = (oldMappings) => {
    if (!oldMappings || !Array.isArray(oldMappings)) {
      return getDefaultFieldMappings();
    }

    const newStructure = { Company: [] };

    oldMappings.forEach((mapping) => {
      // Solo incluir mapeos activos en la nueva estructura
      if (
        mapping.isActive &&
        mapping.bitrixFieldName &&
        mapping.sageFieldName
      ) {
        // Determinar la entidad basándose en el nombre del campo
        let entityType = "Company";
        if (mapping.bitrixFieldName.includes("_PRODUCT_")) {
          entityType = "Product";
        } else if (mapping.bitrixFieldName.includes("_COMPANY_")) {
          entityType = "Company";
        }

        if (!newStructure[entityType]) {
          newStructure[entityType] = [];
        }

        newStructure[entityType].push({
          bitrixFieldName: mapping.bitrixFieldName,
          sageFieldName: mapping.sageFieldName,
        });
      }
    });

    // Si no hay mapeos, usar los por defecto
    if (
      Object.keys(newStructure).length === 0 ||
      (newStructure.Company && newStructure.Company.length === 0)
    ) {
      return getDefaultFieldMappings();
    }

    return newStructure;
  };

  // ✅ Función para obtener y organizar campos desde Bitrix24
  const fetchAndOrganizeFieldMappings = async (localConfig) => {
    try {
      // Solo intentar si tenemos configuración de Bitrix24
      if (!localConfig?.bitrix24?.apiTenant) {
        console.log("No Bitrix24 API configured, using local mappings");
        return localConfig?.fieldMappings || getDefaultFieldMappings();
      }

      console.log("Fetching fields from Bitrix24 API...");
      const bitrixService = new BitrixFieldService(
        localConfig.bitrix24.apiTenant
      );

      // Obtener campos por entidad desde Bitrix24
      const fieldsByEntity = await bitrixService.getAllFieldsByEntity();

      // Convertir a la nueva estructura preservando mapeos existentes
      const existingMappings = Array.isArray(localConfig.fieldMappings)
        ? localConfig.fieldMappings
        : [];

      const newFieldMappings =
        BitrixFieldService.convertToNewFieldMappingsStructure(
          fieldsByEntity,
          existingMappings
        );

      // Si no se encontraron mapeos válidos, usar los por defecto
      if (Object.keys(newFieldMappings).length === 0) {
        console.log("No valid field mappings found, using defaults");
        return getDefaultFieldMappings();
      }

      console.log("Field mappings organized by entity:", newFieldMappings);
      return newFieldMappings;
    } catch (error) {
      console.error("Error fetching Bitrix24 fields:", error);
      console.log("Falling back to local field mappings");

      // Fallback: usar mapeos locales o por defecto
      return localConfig?.fieldMappings || getDefaultFieldMappings();
    }
  };
  useEffect(() => {
    if (config && config !== localConfig) {
      console.log("Dashboard: Syncing external config to local state:", config);
      setLocalConfig(config);
    }
  }, [config]);

  // ✅ Manejar actualizaciones de configuración
  const handleUpdateConfig = (section, data) => {
    console.log(
      `Dashboard: Updating config section "${section}" with data:`,
      data
    );

    const newLocalConfig = { ...localConfig };

    if (section === "general") {
      // Actualizar configuración general
      Object.assign(newLocalConfig, data);
    } else {
      // Actualizar sección específica
      newLocalConfig[section] = { ...newLocalConfig[section], ...data };
    }

    console.log("Dashboard: New local config:", newLocalConfig);
    setLocalConfig(newLocalConfig);

    // Propagar cambios hacia arriba
    if (updateConfig) {
      updateConfig(newLocalConfig);
    }
  };

  // ✅ Función principal para generar archivo de configuración
  const saveConfigurationFile = async () => {
    setIsGenerating(true);
    setGenerationResult(null);

    try {
      console.log(
        "Dashboard: Starting configuration save with local config:",
        localConfig
      );

      // ✅ Obtener y organizar field mappings (nueva estructura)
      let finalFieldMappings;

      if (Array.isArray(localConfig.fieldMappings)) {
        // Migrar estructura antigua a nueva
        console.log("Dashboard: Migrating old field mappings structure");
        finalFieldMappings = migrateFieldMappingsToNewStructure(
          localConfig.fieldMappings
        );
      } else if (typeof localConfig.fieldMappings === "object") {
        // Ya está en la nueva estructura
        finalFieldMappings = localConfig.fieldMappings;
      } else {
        // Obtener desde Bitrix24 o usar por defecto
        finalFieldMappings = await fetchAndOrganizeFieldMappings(localConfig);
      }

      console.log(
        "Dashboard: Final field mappings for save:",
        finalFieldMappings
      );

      // Validar datos de configuración
      const missingFields = [];

      // Verificar configuración de base de datos
      if (!localConfig?.database?.dbHost)
        missingFields.push(t("database.dbHost"));
      if (!localConfig?.database?.dbDatabase)
        missingFields.push(t("database.dbDatabase"));
      if (!localConfig?.database?.dbUsername)
        missingFields.push(t("database.dbUsername"));
      if (!localConfig?.database?.dbPassword)
        missingFields.push(t("database.dbPassword"));

      // Verificar configuración Bitrix - solo si el usuario es admin
      if (isAdmin && !localConfig?.bitrix24?.apiTenant)
        missingFields.push(t("bitrix24.apiTenant"));

      // Verificar si existen companies
      if (!localConfig?.companies?.length)
        missingFields.push(t("dashboard.companies"));

      // Verificar código de cliente
      if (!localConfig?.clientCode) missingFields.push(t("general.clientCode"));

      // ✅ Validar que hay field mappings en la nueva estructura
      const totalMappings = Object.values(finalFieldMappings).reduce(
        (total, entityMappings) => total + (entityMappings?.length || 0),
        0
      );

      if (totalMappings === 0) {
        console.warn("Dashboard: No field mappings found, using defaults");
        finalFieldMappings = getDefaultFieldMappings();
      }

      if (missingFields.length > 0) {
        alert(`${t("dialogs.missingFields")}\n\n${missingFields.join("\n")}`);
        setIsGenerating(false);
        return;
      }

      // ✅ Mapear configuración a estructura JSON esperada con nueva estructura de FieldMappings
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
        Bitrix24: isAdmin
          ? {
              API_Tenant: localConfig.bitrix24.apiTenant,
              pack_empresa: Boolean(localConfig.bitrix24.packEmpresa),
            }
          : null,
        Empresas: (localConfig.companies || []).map((company) => ({
          EmpresaBitrix: company.bitrixCompany,
          EmpresaSage: company.sageCompanyCode,
        })),
        // ✅ Nueva estructura de FieldMappings organizada por entidades
        FieldMappings: finalFieldMappings,
      };

      // Remover propiedades null
      if (!configJson.Bitrix24) {
        delete configJson.Bitrix24;
      }

      console.log("Dashboard: Final config JSON to save:", configJson);

      // Convertir a string JSON
      const jsonString = JSON.stringify(configJson, null, 2);
      console.log("Dashboard: JSON string to encrypt:", jsonString);

      // Definir ruta de salida
      const outputPath = `config`;

      // Llamar a la función de encriptación de Rust via Tauri
      const result = await invoke("encrypt_json", {
        jsonData: jsonString,
        outputPath: outputPath,
        charKey: "T",
      });

      console.log("Dashboard: Encryption result:", result);

      // Mostrar mensaje de éxito
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

  // ✅ Renderizar contenido apropiado basado en la sección activa
  const renderContent = () => {
    // Si el usuario no es admin y trata de acceder a bitrix24, redirigir a dashboard
    if (activeSection === "bitrix24" && !isAdmin) {
      setActiveSection("dashboard");
      return renderContent(); // Llamada recursiva para renderizar dashboard
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

            {/* Información del perfil del usuario si está disponible */}
            {user.profile && (
              <div className="bg-brand-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-onyx-600 mb-2">
                  {t("dashboard.profile")}
                </h3>
                <p className="text-onyx-500">
                  {user.profile.name || user.username}
                </p>
              </div>
            )}

            {/* Tarjetas de configuración para acceso rápido */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl w-full">
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
                description={t("fieldMapping.description")}
                icon="🔄"
                onClick={() => setActiveSection("fieldMapping")}
              />
            </div>

            {/* Botón para generar archivo de configuración */}
            <div className="mt-6 flex flex-col items-center space-y-4">
              <button
                onClick={saveConfigurationFile}
                disabled={isGenerating}
                className={`px-8 py-3 bg-onyx-600 text-brand-white rounded-lg shadow-md hover:bg-onyx-700 transition duration-300 ${
                  isGenerating ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isGenerating
                  ? t("dashboard.saving")
                  : t("dashboard.saveConfiguration")}
              </button>
            </div>

            {/* Estado del servicio y comunicación de prueba - Solo en Dashboard */}
            <div className="mt-6 flex items-center space-x-6">
              <SimpleServiceStatusIndicator />
              <ServiceTestComponent />
            </div>

            {/* Resultado de la generación */}
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

            {/* ✅ Botón de prueba para desarrollo */}
            {process.env.NODE_ENV === "development" && (
              <button
                onClick={() => {
                  console.log("=== CONFIG DEBUG ===");
                  console.log("Local config:", localConfig);
                  console.log("Props config:", config);
                  console.log("User:", user);
                  console.log("Active section:", activeSection);
                }}
                className="px-4 py-2 bg-yellow-500 text-white rounded"
              >
                🐛 Debug Config
              </button>
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

      {/* ✅ Panel de debug para desarrollo */}
      {process.env.NODE_ENV === "development" && (
        <ConfigDebugPanel
          config={config}
          localConfig={localConfig}
          user={user}
        />
      )}
    </div>
  );
}

// Componentes helper
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
