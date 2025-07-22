import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

// Campos de Bitrix24 con nombres amigables mejorados
const BITRIX_FIELDS = [
  {
    name: "UF_CRM_DRIVEFOLDERID",
    englishName: "Drive Folder ID",
    type: "drivefolderid",
    mandatory: false
  },
  {
    name: "UF_CRM_DRIVEFOLDERLINK",
    englishName: "Drive Folder Link",
    type: "drivefolderlink",
    mandatory: false
  },
  {
    name: "UF_CRM_635267602077F",
    englishName: "Photos Maps App",
    type: "custom_maps_photos_view",
    mandatory: false
  },
  {
    name: "UF_LOGO",
    englishName: "Company Logo",
    type: "file",
    mandatory: false
  },
  {
    name: "UF_CRM_ID_OFERTA_SAGE",
    englishName: "Sage Offer ID",
    type: "string",
    mandatory: false
  },
  {
    name: "UF_CRM_ID_CARPETA_DRIVE",
    englishName: "Drive Folder ID",
    type: "string",
    mandatory: false
  },
  {
    name: "UF_CRM_IFRAME_WIDGET_CUSTOM",
    englishName: "Custom Widget",
    type: "rest_iframe_widget_bit24bitrix24eu_v2",
    mandatory: false
  },
  {
    name: "UF_CRM_1750860486",
    englishName: "Activity Guide ID",
    type: "string",
    mandatory: true
  },
  {
    name: "UF_STAMP",
    englishName: "Company Stamp",
    type: "file",
    mandatory: false
  },
  {
    name: "UF_DIRECTOR_SIGN",
    englishName: "Director Signature",
    type: "file",
    mandatory: false
  },
  {
    name: "UF_ACCOUNTANT_SIGN",
    englishName: "Accountant Signature",
    type: "file",
    mandatory: false
  },
  // Campos del conector
  {
    name: "UF_CRM_COMPANY_CATEGORIA",
    englishName: "Company Category",
    type: "string",
    mandatory: true
  },
  {
    name: "UF_CRM_COMPANY_RAZON",
    englishName: "Company Name",
    type: "string",
    mandatory: true
  },
  {
    name: "UF_CRM_COMPANY_DIVISA",
    englishName: "Currency",
    type: "string",
    mandatory: false
  },
  {
    name: "UF_CRM_COMPANY_DOMICILIO",
    englishName: "Address",
    type: "string",
    mandatory: false
  },
  {
    name: "UF_CRM_COMPANY_TELEFONO",
    englishName: "Phone Number",
    type: "string",
    mandatory: false
  },
  {
    name: "UF_CRM_COMPANY_EMAIL",
    englishName: "Email Address",
    type: "string",
    mandatory: false
  }
];

// Campos de Sage Company (basados en el conector)
const SAGE_FIELDS = [
  {
    name: "CodigoCategoriaCliente",
    description: "Código de categoría del cliente",
  },
  { name: "RazonSocial", description: "Razón social de la empresa" },
  { name: "CodigoDivisa", description: "Código de divisa" },
  { name: "Domicilio", description: "Dirección principal" },
  { name: "Domicilio2", description: "Dirección secundaria" },
  { name: "Municipio", description: "Municipio" },
  { name: "CodigoPostal", description: "Código postal" },
  { name: "Provincia", description: "Provincia" },
  { name: "Nacion", description: "País" },
  { name: "CodigoNacion", description: "Código del país" },
  { name: "Telefono", description: "Número de teléfono" },
  { name: "EMail1", description: "Correo electrónico principal" },
  { name: "IdCliente", description: "ID único del cliente" },
  { name: "NombreComercial", description: "Nombre comercial" },
  { name: "CIF", description: "CIF/NIF de la empresa" },
];

// Función helper para obtener nombre amigable
const getFieldDisplayName = (fieldName) => {
  const field = BITRIX_FIELDS.find(f => f.name === fieldName);
  return field ? field.englishName : fieldName;
};

function FieldMapping({ config, updateConfig }) {
  const { t } = useTranslation();
  const [mappedFields, setMappedFields] = useState([]);
  const [searchBitrix, setSearchBitrix] = useState("");
  const [searchSage, setSearchSage] = useState("");

  // ✅ Función para obtener mapeos por defecto (misma que en Dashboard)
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

  // ✅ Mejorar useEffect con mejor logging y sincronización
  useEffect(() => {
    console.log("FieldMapping: Config received:", config); // Debug log
    console.log("FieldMapping: fieldMappings from config:", config?.fieldMappings); // Debug log
    
    if (Array.isArray(config?.fieldMappings) && config.fieldMappings.length > 0) {
      console.log("FieldMapping: Using existing field mappings"); // Debug log
      setMappedFields(config.fieldMappings);
    } else {
      console.log("FieldMapping: Creating default field mappings"); // Debug log
      const defaultMappings = getDefaultFieldMappings();
      setMappedFields(defaultMappings);
      
      // ✅ Usar setTimeout para asegurar que la actualización se propaga correctamente
      setTimeout(() => {
        console.log("FieldMapping: Updating config with default mappings:", defaultMappings); // Debug log
        updateConfig(defaultMappings);
      }, 100);
    }
  }, [config, updateConfig]);

  // ✅ Función helper para actualizar mapeos con logging
  const updateMappedFields = (newMappings) => {
    console.log("FieldMapping: Updating mapped fields:", newMappings); // Debug log
    setMappedFields(newMappings);
    updateConfig(newMappings);
  };

  // ✅ Mejorar add mapping con mejor logging
  const addMapping = (bitrixField, sageField) => {
    console.log("FieldMapping: Adding mapping:", { bitrixField, sageField }); // Debug log
    
    const newMapping = {
      bitrixFieldName: bitrixField.name,
      bitrixFieldType: bitrixField.type,
      sageFieldName: sageField.name,
      sageFieldDescription: sageField.description,
      isActive: true,
      isMandatory: bitrixField.mandatory,
    };

    const updatedMappings = [...mappedFields, newMapping];
    console.log("FieldMapping: New mappings array:", updatedMappings); // Debug log
    updateMappedFields(updatedMappings);
  };

  // ✅ Mejorar remove mapping
  const removeMapping = (index) => {
    console.log("FieldMapping: Removing mapping at index:", index); // Debug log
    const updatedMappings = mappedFields.filter((_, i) => i !== index);
    console.log("FieldMapping: Mappings after removal:", updatedMappings); // Debug log
    updateMappedFields(updatedMappings);
  };

  // ✅ Mejorar toggle mapping
  const toggleMapping = (index) => {
    console.log("FieldMapping: Toggling mapping at index:", index); // Debug log
    const updatedMappings = mappedFields.map((mapping, i) =>
      i === index ? { ...mapping, isActive: !mapping.isActive } : mapping
    );
    console.log("FieldMapping: Mappings after toggle:", updatedMappings); // Debug log
    updateMappedFields(updatedMappings);
  };

  // Check if field is already mapped
  const isBitrixFieldMapped = (fieldName) => {
    return mappedFields.some(
      (mapping) => mapping.bitrixFieldName === fieldName
    );
  };

  const isSageFieldMapped = (fieldName) => {
    return mappedFields.some((mapping) => mapping.sageFieldName === fieldName);
  };

  // Check if a mapping is from the known connector mappings
  const isKnownMapping = (bitrixFieldName) => {
    const knownFields = [
      "UF_CRM_COMPANY_CATEGORIA",
      "UF_CRM_COMPANY_RAZON", 
      "UF_CRM_COMPANY_DIVISA",
      "UF_CRM_COMPANY_DOMICILIO",
      "UF_CRM_COMPANY_TELEFONO",
      "UF_CRM_COMPANY_EMAIL"
    ];
    return knownFields.includes(bitrixFieldName);
  };

  // Filter fields
  const filteredBitrixFields = BITRIX_FIELDS.filter((field) => {
    const searchLower = searchBitrix.toLowerCase();
    return field.englishName.toLowerCase().includes(searchLower);
  });

  const filteredSageFields = SAGE_FIELDS.filter(
    (field) =>
      field.name.toLowerCase().includes(searchSage.toLowerCase()) ||
      field.description.toLowerCase().includes(searchSage.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-brand-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-onyx-600">
          {t("fieldMapping.title")}
        </h2>

        {/* ✅ Añadir información de debug en desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-yellow-800">
                🐛 Debug Info (Development Only)
              </summary>
              <div className="mt-2 text-xs text-yellow-700">
                <p><strong>Mapped fields count:</strong> {mappedFields.length}</p>
                <p><strong>Config field mappings:</strong> {config?.fieldMappings?.length || 0}</p>
                <pre className="mt-2 text-xs bg-yellow-100 p-2 rounded max-h-40 overflow-auto">
                  {JSON.stringify(mappedFields, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}

        {/* Search bars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-onyx-600 text-sm font-bold mb-2">
              {t("fieldMapping.searchBitrix")}
            </label>
            <input
              type="text"
              value={searchBitrix}
              onChange={(e) => setSearchBitrix(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-onyx-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder={t("fieldMapping.searchBitrixPlaceholder")}
            />
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <span className="text-lg font-semibold text-onyx-600">
                {t("fieldMapping.mappingsCount")}: {mappedFields.length}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-onyx-600 text-sm font-bold mb-2">
              {t("fieldMapping.searchSage")}
            </label>
            <input
              type="text"
              value={searchSage}
              onChange={(e) => setSearchSage(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-onyx-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder={t("fieldMapping.searchSagePlaceholder")}
            />
          </div>
        </div>

        {/* Three column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Bitrix Fields Column */}
          <div className="bg-onyx-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-onyx-700">
              {t("fieldMapping.bitrixFields")}
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredBitrixFields.map((field, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-2 border-dashed transition-all cursor-pointer ${
                    isBitrixFieldMapped(field.name)
                      ? "bg-green-100 border-green-300 text-green-800"
                      : "bg-white border-onyx-300 hover:border-onyx-400"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-onyx-800">
                        {field.englishName}
                      </div>
                    </div>
                    {isBitrixFieldMapped(field.name) && (
                      <span className="text-green-600 text-sm">✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mapped Fields Column */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-onyx-700">
              {t("fieldMapping.mappedFields")}
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {mappedFields.length === 0 ? (
                <div className="text-center text-onyx-500 py-8">
                  <p>{t("fieldMapping.noMappings")}</p>
                  <p className="text-sm mt-2">
                    {t("fieldMapping.dragToCreate")}
                  </p>
                </div>
              ) : (
                mappedFields.map((mapping, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border transition-all ${
                      mapping.isActive
                        ? "bg-white border-blue-300"
                        : "bg-onyx-100 border-onyx-300 opacity-60"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-blue-800">
                          {getFieldDisplayName(mapping.bitrixFieldName)}
                        </div>
                        {isKnownMapping(mapping.bitrixFieldName) && (
                          <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                            {t("fieldMapping.connectorMapping")}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeMapping(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                        title={t("fieldMapping.removeMapping")}
                      >
                        ✕
                      </button>
                    </div>

                    <div className="flex items-center justify-center my-2">
                      <span className="text-blue-600 font-bold">↕</span>
                    </div>

                    <div className="text-sm font-semibold text-green-800">
                      {mapping.sageFieldName}
                    </div>

                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-onyx-600">
                        {mapping.sageFieldDescription}
                      </span>
                      <button
                        onClick={() => toggleMapping(index)}
                        className={`text-xs px-2 py-1 rounded ${
                          mapping.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-onyx-200 text-onyx-600"
                        }`}
                      >
                        {mapping.isActive
                          ? t("fieldMapping.active")
                          : t("fieldMapping.inactive")}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sage Fields Column */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-onyx-700">
              {t("fieldMapping.sageFields")}
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredSageFields.map((field, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-2 border-dashed transition-all cursor-pointer ${
                    isSageFieldMapped(field.name)
                      ? "bg-blue-100 border-blue-300 text-blue-800"
                      : "bg-white border-onyx-300 hover:border-onyx-400"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{field.name}</div>
                      <div className="text-xs text-onyx-600 mt-1">
                        {field.description}
                      </div>
                    </div>
                    {isSageFieldMapped(field.name) && (
                      <span className="text-blue-600 text-sm">✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick mapping interface */}
        <div className="mt-6 p-4 bg-onyx-50 rounded-lg">
          <h4 className="text-md font-semibold mb-3 text-onyx-600">
            {t("fieldMapping.quickMapping")}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              id="bitrix-select"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-onyx-700 leading-tight focus:outline-none focus:shadow-outline"
              defaultValue=""
            >
              <option value="">{t("fieldMapping.selectBitrixField")}</option>
              {BITRIX_FIELDS.filter(
                (field) => !isBitrixFieldMapped(field.name)
              ).map((field, index) => (
                <option key={index} value={JSON.stringify(field)}>
                  {field.englishName}
                </option>
              ))}
            </select>

            <select
              id="sage-select"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-onyx-700 leading-tight focus:outline-none focus:shadow-outline"
              defaultValue=""
            >
              <option value="">{t("fieldMapping.selectSageField")}</option>
              {SAGE_FIELDS.filter(
                (field) => !isSageFieldMapped(field.name)
              ).map((field, index) => (
                <option key={index} value={JSON.stringify(field)}>
                  {field.name} - {field.description}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 text-center">
            <button
              onClick={() => {
                const bitrixSelect = document.getElementById("bitrix-select");
                const sageSelect = document.getElementById("sage-select");

                if (bitrixSelect.value && sageSelect.value) {
                  const bitrixField = JSON.parse(bitrixSelect.value);
                  const sageField = JSON.parse(sageSelect.value);
                  addMapping(bitrixField, sageField);
                  bitrixSelect.value = "";
                  sageSelect.value = "";
                }
              }}
              className="bg-onyx-400 hover:bg-onyx-500 text-brand-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline transition duration-300"
            >
              {t("fieldMapping.createMapping")}
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-onyx-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-onyx-600">
            {t("fieldMapping.summary")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-onyx-600">
                {t("fieldMapping.totalBitrixFields")}:{" "}
              </span>
              <span className="font-bold">{BITRIX_FIELDS.length}</span>
            </div>
            <div>
              <span className="text-onyx-600">
                {t("fieldMapping.totalSageFields")}:{" "}
              </span>
              <span className="font-bold">{SAGE_FIELDS.length}</span>
            </div>
            <div>
              <span className="text-onyx-600">
                {t("fieldMapping.mappedFields")}:{" "}
              </span>
              <span className="font-bold">{mappedFields.length}</span>
            </div>
            <div>
              <span className="text-onyx-600">
                {t("fieldMapping.activeFields")}:{" "}
              </span>
              <span className="font-bold text-green-600">
                {mappedFields.filter((m) => m.isActive).length}
              </span>
            </div>
          </div>
          
          {/* Info message */}
          <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400">
            <p className="text-blue-700 text-sm">
              💡 <strong>Consejo:</strong> Los mapeos marcados como "Del conector" son campos que ya usa el conector actual. 
              Solo se muestran los nombres amigables para simplificar la interfaz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FieldMapping;