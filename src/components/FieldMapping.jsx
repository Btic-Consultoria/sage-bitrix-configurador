import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import BitrixFieldService from "../services/BitrixFieldService";

// Campos de Sage organizados por entidad
const SAGE_FIELDS_BY_ENTITY = {
  Company: [
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
  ],
  Product: [
    { name: "CodigoProducto", description: "Código del producto" },
    { name: "NombreProducto", description: "Nombre del producto" },
    { name: "DescripcionProducto", description: "Descripción del producto" },
    { name: "PrecioVenta", description: "Precio de venta" },
    { name: "PrecioCompra", description: "Precio de compra" },
    { name: "Stock", description: "Cantidad en stock" },
    { name: "UnidadMedida", description: "Unidad de medida" },
  ],
};

// Lista básica de campos de Bitrix24 (fallback si no se puede conectar al API)
const BITRIX_FIELDS_FALLBACK = {
  Company: [
    { fieldName: "UF_CRM_COMPANY_CATEGORIA", entityId: "CRM_COMPANY" },
    { fieldName: "UF_CRM_COMPANY_RAZON", entityId: "CRM_COMPANY" },
    { fieldName: "UF_CRM_COMPANY_DIVISA", entityId: "CRM_COMPANY" },
    { fieldName: "UF_CRM_COMPANY_DOMICILIO", entityId: "CRM_COMPANY" },
    { fieldName: "UF_CRM_COMPANY_TELEFONO", entityId: "CRM_COMPANY" },
    { fieldName: "UF_CRM_COMPANY_EMAIL", entityId: "CRM_COMPANY" },
  ],
  Product: [
    { fieldName: "UF_CRM_PRODUCT_CODE", entityId: "CRM_PRODUCT" },
    { fieldName: "UF_CRM_PRODUCT_NAME", entityId: "CRM_PRODUCT" },
  ],
};

function FieldMapping({ config, updateConfig }) {
  const { t } = useTranslation();
  const [fieldMappings, setFieldMappings] = useState({
    Company: [],
    Product: [],
  });
  const [bitrixFields, setBitrixFields] = useState({
    Company: [],
    Product: [],
  });
  const [activeEntity, setActiveEntity] = useState("Company");
  const [isLoadingBitrixFields, setIsLoadingBitrixFields] = useState(false);
  const [searchBitrix, setSearchBitrix] = useState("");
  const [searchSage, setSearchSage] = useState("");

  // ✅ Obtener mapeos por defecto en nueva estructura
  const getDefaultFieldMappings = () => ({
    Company: [
      {
        bitrixFieldName: "UF_CRM_COMPANY_CATEGORIA",
        sageFieldName: "CodigoCategoriaCliente",
      },
      { bitrixFieldName: "UF_CRM_COMPANY_RAZON", sageFieldName: "RazonSocial" },
      {
        bitrixFieldName: "UF_CRM_COMPANY_DIVISA",
        sageFieldName: "CodigoDivisa",
      },
      {
        bitrixFieldName: "UF_CRM_COMPANY_DOMICILIO",
        sageFieldName: "Domicilio",
      },
      { bitrixFieldName: "UF_CRM_COMPANY_TELEFONO", sageFieldName: "Telefono" },
      { bitrixFieldName: "UF_CRM_COMPANY_EMAIL", sageFieldName: "EMail1" },
    ],
  });

  // ✅ Migrar estructura antigua a nueva si es necesario
  const migrateToNewStructure = (oldMappings) => {
    if (!oldMappings) {
      return getDefaultFieldMappings();
    }

    // Si ya es la nueva estructura (objeto con entidades)
    if (typeof oldMappings === "object" && !Array.isArray(oldMappings)) {
      return oldMappings;
    }

    // Si es array (estructura antigua)
    if (Array.isArray(oldMappings)) {
      const newStructure = { Company: [], Product: [] };

      oldMappings.forEach((mapping) => {
        if (
          mapping.isActive &&
          mapping.bitrixFieldName &&
          mapping.sageFieldName
        ) {
          let entityType = "Company";
          if (mapping.bitrixFieldName.includes("_PRODUCT_")) {
            entityType = "Product";
          }

          newStructure[entityType].push({
            bitrixFieldName: mapping.bitrixFieldName,
            sageFieldName: mapping.sageFieldName,
          });
        }
      });

      return newStructure.Company.length > 0 || newStructure.Product.length > 0
        ? newStructure
        : getDefaultFieldMappings();
    }

    return getDefaultFieldMappings();
  };

  // ✅ Cargar campos desde Bitrix24
  const loadBitrixFields = async () => {
    if (!config?.bitrix24?.apiTenant) {
      console.log("No Bitrix24 API configured, using fallback field list");
      setBitrixFields(BITRIX_FIELDS_FALLBACK);
      return;
    }

    setIsLoadingBitrixFields(true);
    try {
      const bitrixService = new BitrixFieldService(config.bitrix24.apiTenant);
      const fieldsByEntity = await bitrixService.getAllFieldsByEntity();

      setBitrixFields(fieldsByEntity);
      console.log("Loaded Bitrix24 fields by entity:", fieldsByEntity);
    } catch (error) {
      console.error("Error loading Bitrix24 fields:", error);
      // Usar fallback si hay error
      setBitrixFields(BITRIX_FIELDS_FALLBACK);
    } finally {
      setIsLoadingBitrixFields(false);
    }
  };

  // ✅ Inicializar component
  useEffect(() => {
    // Migrar y establecer mapeos
    const migratedMappings = migrateToNewStructure(config?.fieldMappings);
    setFieldMappings(migratedMappings);

    // Cargar campos de Bitrix24
    loadBitrixFields();
  }, [config]);

  // ✅ Guardar cambios en configuración
  const saveFieldMappings = () => {
    const totalMappings = Object.values(fieldMappings).reduce(
      (total, entityMappings) => total + (entityMappings?.length || 0),
      0
    );

    console.log(
      `Saving ${totalMappings} field mappings in new structure:`,
      fieldMappings
    );
    updateConfig({ fieldMappings });
  };

  // ✅ Añadir nuevo mapeo
  const addMapping = (entityType) => {
    const newMappings = { ...fieldMappings };
    if (!newMappings[entityType]) {
      newMappings[entityType] = [];
    }

    newMappings[entityType].push({
      bitrixFieldName: "",
      sageFieldName: "",
    });

    setFieldMappings(newMappings);
  };

  // ✅ Eliminar mapeo
  const removeMapping = (entityType, index) => {
    const newMappings = { ...fieldMappings };
    if (newMappings[entityType]) {
      newMappings[entityType].splice(index, 1);
      setFieldMappings(newMappings);
    }
  };

  // ✅ Actualizar mapeo
  const updateMapping = (entityType, index, field, value) => {
    const newMappings = { ...fieldMappings };
    if (newMappings[entityType] && newMappings[entityType][index]) {
      newMappings[entityType][index][field] = value;
      setFieldMappings(newMappings);
    }
  };

  // ✅ Filtrar campos para búsqueda
  const getFilteredBitrixFields = (entityType) => {
    const fields = bitrixFields[entityType] || [];
    return fields.filter((field) =>
      field.fieldName.toLowerCase().includes(searchBitrix.toLowerCase())
    );
  };

  const getFilteredSageFields = (entityType) => {
    const fields = SAGE_FIELDS_BY_ENTITY[entityType] || [];
    return fields.filter(
      (field) =>
        field.name.toLowerCase().includes(searchSage.toLowerCase()) ||
        field.description.toLowerCase().includes(searchSage.toLowerCase())
    );
  };

  return (
    <div className="field-mapping-container p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 text-onyx-600">
          {t("fieldMapping.title") || "Mapeo de Campos"}
        </h2>
        <p className="text-gray-600 mb-4">
          Configure los mapeos entre campos de Bitrix24 y Sage, organizados por
          entidad.
        </p>
      </div>

      {/* Tabs para entidades */}
      <div className="mb-6">
        <div className="flex border-b">
          {Object.keys(fieldMappings).map((entityType) => (
            <button
              key={entityType}
              onClick={() => setActiveEntity(entityType)}
              className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                activeEntity === entityType
                  ? "border-onyx-500 text-onyx-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {entityType} ({fieldMappings[entityType]?.length || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Contenido de la entidad activa */}
      <div className="entity-content">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-onyx-600">
            Mapeos para {activeEntity}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => addMapping(activeEntity)}
              className="px-4 py-2 bg-onyx-500 text-white rounded hover:bg-onyx-600 transition-colors"
            >
              + Añadir Mapeo
            </button>
            {isLoadingBitrixFields && (
              <div className="px-4 py-2 text-sm text-gray-500">
                Cargando campos de Bitrix24...
              </div>
            )}
          </div>
        </div>

        {/* Filtros de búsqueda */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar campos Bitrix24
            </label>
            <input
              type="text"
              value={searchBitrix}
              onChange={(e) => setSearchBitrix(e.target.value)}
              placeholder="Filtrar campos..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-onyx-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar campos Sage
            </label>
            <input
              type="text"
              value={searchSage}
              onChange={(e) => setSearchSage(e.target.value)}
              placeholder="Filtrar campos..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-onyx-500"
            />
          </div>
        </div>

        {/* Lista de mapeos */}
        <div className="space-y-4 mb-6">
          {(fieldMappings[activeEntity] || []).map((mapping, index) => (
            <div
              key={index}
              className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campo Bitrix24
                </label>
                <select
                  value={mapping.bitrixFieldName}
                  onChange={(e) =>
                    updateMapping(
                      activeEntity,
                      index,
                      "bitrixFieldName",
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-onyx-500"
                >
                  <option value="">Seleccionar campo...</option>
                  {getFilteredBitrixFields(activeEntity).map((field) => (
                    <option key={field.fieldName} value={field.fieldName}>
                      {field.fieldName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campo Sage
                </label>
                <select
                  value={mapping.sageFieldName}
                  onChange={(e) =>
                    updateMapping(
                      activeEntity,
                      index,
                      "sageFieldName",
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-onyx-500"
                >
                  <option value="">Seleccionar campo...</option>
                  {getFilteredSageFields(activeEntity).map((field) => (
                    <option
                      key={field.name}
                      value={field.name}
                      title={field.description}
                    >
                      {field.name} - {field.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 flex justify-end">
                <button
                  onClick={() => removeMapping(activeEntity, index)}
                  className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Mensaje si no hay mapeos */}
        {(!fieldMappings[activeEntity] ||
          fieldMappings[activeEntity].length === 0) && (
          <div className="text-center py-8 text-gray-500">
            No hay mapeos configurados para {activeEntity}.
            <br />
            <button
              onClick={() => addMapping(activeEntity)}
              className="mt-2 text-onyx-600 hover:underline"
            >
              Añadir el primer mapeo
            </button>
          </div>
        )}
      </div>

      {/* Resumen */}
      <div className="mt-8 p-4 bg-onyx-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-onyx-600">Resumen</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {Object.keys(fieldMappings).map((entityType) => (
            <div key={entityType}>
              <span className="text-onyx-600">Mapeos {entityType}: </span>
              <span className="font-bold">
                {fieldMappings[entityType]?.length || 0}
              </span>
            </div>
          ))}
          <div>
            <span className="text-onyx-600">Total: </span>
            <span className="font-bold text-green-600">
              {Object.values(fieldMappings).reduce(
                (total, mappings) => total + (mappings?.length || 0),
                0
              )}
            </span>
          </div>
        </div>

        {/* Botón para guardar */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={saveFieldMappings}
            className="px-6 py-2 bg-onyx-600 text-white rounded-lg hover:bg-onyx-700 transition-colors"
          >
            Guardar Mapeos
          </button>
        </div>

        {/* Info message */}
        <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400">
          <p className="text-blue-700 text-sm">
            💡 <strong>Información:</strong> La nueva estructura organiza los
            campos por entidades (Company/Product). Solo se almacenan los campos
            Bitrix24 y Sage correspondientes, simplificando la configuración.
          </p>
        </div>
      </div>
    </div>
  );
}

export default FieldMapping;
