// src/services/BitrixFieldService.js
class BitrixFieldService {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
  }

  /**
   * Obtiene los campos personalizados de una entidad de Bitrix24
   * @param {string} entityType - 'CRM_COMPANY' o 'CRM_PRODUCT'
   * @returns {Promise<Array>} Lista de campos
   */
  async getUserFields(entityType = "CRM_COMPANY") {
    try {
      const endpoint =
        entityType === "CRM_COMPANY"
          ? "crm.company.userfield.list"
          : "crm.product.userfield.list";

      const response = await fetch(this.apiUrl + endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(`Bitrix24 API Error: ${data.error_description}`);
      }

      // Filtrar campos según ENTITY_ID y devolver solo los relevantes
      return (data.result || [])
        .filter((field) => field.ENTITY_ID === entityType)
        .map((field) => ({
          id: field.ID,
          fieldName: field.FIELD_NAME,
          entityId: field.ENTITY_ID,
          userTypeId: field.USER_TYPE_ID,
          mandatory: field.MANDATORY === "Y",
          multiple: field.MULTIPLE === "Y",
          xmlId: field.XML_ID,
          sort: field.SORT,
        }));
    } catch (error) {
      console.error("Error fetching Bitrix24 user fields:", error);
      throw error;
    }
  }

  /**
   * Obtiene todos los campos organizados por entidad
   * @returns {Promise<Object>} Objeto con campos organizados por Company/Product
   */
  async getAllFieldsByEntity() {
    try {
      const [companyFields, productFields] = await Promise.all([
        this.getUserFields("CRM_COMPANY"),
        this.getUserFields("CRM_PRODUCT"),
      ]);

      return {
        Company: companyFields,
        Product: productFields,
      };
    } catch (error) {
      console.error("Error fetching all fields by entity:", error);
      throw error;
    }
  }

  /**
   * Mapea el ENTITY_ID a nombre amigable
   * @param {string} entityId
   * @returns {string}
   */
  static getEntityDisplayName(entityId) {
    const entityMap = {
      CRM_COMPANY: "Company",
      CRM_PRODUCT: "Product",
      CRM_CONTACT: "Contact",
      CRM_DEAL: "Deal",
      CRM_LEAD: "Lead",
    };

    return entityMap[entityId] || entityId;
  }

  /**
   * Convierte campos de entidad a la nueva estructura de FieldMappings
   * @param {Object} fieldsByEntity - Campos organizados por entidad
   * @param {Array} existingMappings - Mapeos existentes para preservar las relaciones con Sage
   * @returns {Object} Nueva estructura de FieldMappings
   */
  static convertToNewFieldMappingsStructure(
    fieldsByEntity,
    existingMappings = []
  ) {
    const newFieldMappings = {};

    Object.keys(fieldsByEntity).forEach((entityKey) => {
      const fields = fieldsByEntity[entityKey];
      newFieldMappings[entityKey] = [];

      fields.forEach((field) => {
        // Buscar si ya existe un mapeo para este campo
        const existingMapping = existingMappings.find(
          (mapping) => mapping.bitrixFieldName === field.fieldName
        );

        if (existingMapping) {
          // Si existe, mantener solo bitrixFieldName y sageFieldName
          newFieldMappings[entityKey].push({
            bitrixFieldName: field.fieldName,
            sageFieldName: existingMapping.sageFieldName,
          });
        }
        // Si no existe mapeo previo, no lo incluimos en la configuración
        // Solo incluimos campos que ya tengan una relación definida con Sage
      });
    });

    // Limpiar entidades vacías
    Object.keys(newFieldMappings).forEach((key) => {
      if (newFieldMappings[key].length === 0) {
        delete newFieldMappings[key];
      }
    });

    return newFieldMappings;
  }
}

export default BitrixFieldService;
