import { useState } from "react";

function ConfigDebugPanel({ config, localConfig, user }) {
  const [isOpen, setIsOpen] = useState(false);

  const exportConfigAsJSON = () => {
    const configData = {
      timestamp: new Date().toISOString(),
      user: user.username,
      userType: user.userType,
      config,
      localConfig,
      comparison: {
        configHasFieldMappings: !!config?.fieldMappings?.length,
        localConfigHasFieldMappings: !!localConfig?.fieldMappings?.length,
        configFieldMappingsCount: config?.fieldMappings?.length || 0,
        localConfigFieldMappingsCount: localConfig?.fieldMappings?.length || 0,
      },
    };

    const blob = new Blob([JSON.stringify(configData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `config-debug-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const testSaveConfig = () => {
    console.group("🧪 CONFIG TEST");
    console.log("User:", user);
    console.log("Config prop:", config);
    console.log("Local config:", localConfig);
    console.log("Field mappings in config:", config?.fieldMappings);
    console.log("Field mappings in local config:", localConfig?.fieldMappings);
    console.log(
      "Field mappings count:",
      localConfig?.fieldMappings?.length || 0
    );

    // Test what would be saved
    console.group("📦 What would be saved:");
    const testSaveData = {
      CodigoCliente: localConfig?.clientCode || user.username,
      FieldMappings: localConfig?.fieldMappings || [],
      FieldMappingsCount: localConfig?.fieldMappings?.length || 0,
    };
    console.log(testSaveData);
    console.groupEnd();
    console.groupEnd();
  };

  const testConfigSync = () => {
    console.group("🔄 CONFIG SYNC TEST");
    console.log(
      "Config and LocalConfig are synced:",
      JSON.stringify(config) === JSON.stringify(localConfig)
    );

    if (JSON.stringify(config) !== JSON.stringify(localConfig)) {
      console.warn("❌ Config and LocalConfig are NOT synced!");
      console.log("Config:", config);
      console.log("LocalConfig:", localConfig);

      // Check specific differences
      const configKeys = Object.keys(config || {});
      const localConfigKeys = Object.keys(localConfig || {});

      console.log(
        "Keys in config but not in localConfig:",
        configKeys.filter((key) => !localConfigKeys.includes(key))
      );
      console.log(
        "Keys in localConfig but not in config:",
        localConfigKeys.filter((key) => !configKeys.includes(key))
      );
    } else {
      console.log("✅ Config and LocalConfig are synced!");
    }
    console.groupEnd();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors"
        title="Debug Panel"
      >
        🐛
      </button>

      {isOpen && (
        <div className="absolute bottom-12 right-0 w-96 bg-white rounded-lg shadow-xl border p-4 max-h-96 overflow-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800">Config Debug Panel</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div className="p-2 bg-gray-50 rounded">
              <strong>User:</strong> {user.username} ({user.userType})
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-blue-50 rounded">
                <strong>Config Field Mappings:</strong>
                <br />
                Count: {config?.fieldMappings?.length || 0}
              </div>

              <div className="p-2 bg-green-50 rounded">
                <strong>Local Config Field Mappings:</strong>
                <br />
                Count: {localConfig?.fieldMappings?.length || 0}
              </div>
            </div>

            <div className="p-2 bg-yellow-50 rounded text-xs">
              <strong>Companies:</strong> {localConfig?.companies?.length || 0}
              <br />
              <strong>Database Config:</strong>
              <ul className="ml-4 text-xs text-gray-600">
                <li>Host: {localConfig?.database?.dbHost ? "✅" : "❌"}</li>
                <li>
                  Database: {localConfig?.database?.dbDatabase ? "✅" : "❌"}
                </li>
                <li>
                  Username: {localConfig?.database?.dbUsername ? "✅" : "❌"}
                </li>
                <li>
                  Password: {localConfig?.database?.dbPassword ? "✅" : "❌"}
                </li>
              </ul>
            </div>

            {localConfig?.fieldMappings &&
              localConfig.fieldMappings.length > 0 && (
                <div className="p-2 bg-purple-50 rounded">
                  <strong>Field Mappings Preview:</strong>
                  <div className="max-h-32 overflow-auto bg-white p-2 rounded text-xs mt-1 border">
                    {localConfig.fieldMappings
                      .slice(0, 5)
                      .map((mapping, index) => (
                        <div key={index} className="mb-1 text-xs">
                          <span className="text-blue-600">
                            {mapping.bitrixFieldName}
                          </span>
                          <span className="text-gray-500"> → </span>
                          <span className="text-green-600">
                            {mapping.sageFieldName}
                          </span>
                          {mapping.isActive ? " ✅" : " ❌"}
                        </div>
                      ))}
                    {localConfig.fieldMappings.length > 5 && (
                      <div className="text-gray-500 text-center">
                        ... and {localConfig.fieldMappings.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Status indicators */}
            <div className="flex justify-between text-xs">
              <div
                className={`px-2 py-1 rounded ${
                  localConfig?.fieldMappings?.length > 0
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                Field Mappings:{" "}
                {localConfig?.fieldMappings?.length > 0 ? "OK" : "Missing"}
              </div>

              <div
                className={`px-2 py-1 rounded ${
                  JSON.stringify(config) === JSON.stringify(localConfig)
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                Sync:{" "}
                {JSON.stringify(config) === JSON.stringify(localConfig)
                  ? "OK"
                  : "Out of sync"}
              </div>
            </div>

            <div className="flex flex-wrap gap-1 pt-2 border-t">
              <button
                onClick={testSaveConfig}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
              >
                🧪 Test Console
              </button>

              <button
                onClick={testConfigSync}
                className="px-2 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600 transition-colors"
              >
                🔄 Test Sync
              </button>

              <button
                onClick={exportConfigAsJSON}
                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
              >
                📁 Export JSON
              </button>

              <button
                onClick={() => {
                  console.log("🔍 CURRENT STATE DUMP:");
                  console.log(
                    "localConfig.fieldMappings:",
                    localConfig?.fieldMappings
                  );
                  console.log("Type:", typeof localConfig?.fieldMappings);
                  console.log(
                    "Is Array:",
                    Array.isArray(localConfig?.fieldMappings)
                  );
                  console.log("Length:", localConfig?.fieldMappings?.length);
                }}
                className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 transition-colors"
              >
                🔍 Dump State
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConfigDebugPanel;
