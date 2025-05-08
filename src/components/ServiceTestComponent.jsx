import { useState } from "react";

function ServiceTestComponent() {
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const testEchoCommand = async () => {
    setIsLoading(true);
    setResult("");
    setError("");

    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const response = await invoke("echo_test", { message: "Hello from React" });
      setResult(response);
    } catch (err) {
      console.error("Echo test failed:", err);
      setError(err.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const testServiceCheck = async () => {
    setIsLoading(true);
    setResult("");
    setError("");

    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const isRunning = await invoke("check_service_status");
      setResult(`Service is ${isRunning ? "RUNNING" : "STOPPED"}`);
    } catch (err) {
      console.error("Service check failed:", err);
      setError(err.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const testServiceStart = async () => {
    setIsLoading(true);
    setResult("");
    setError("");

    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const success = await invoke("start_service");
      setResult(`Start command ${success ? "succeeded" : "failed"}`);
    } catch (err) {
      console.error("Service start failed:", err);
      setError(err.toString());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">Tauri Communication Test</h2>
      
      <div className="space-y-4">
        <div>
          <button
            onClick={testEchoCommand}
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Test Echo
          </button>
        </div>
        
        <div>
          <button
            onClick={testServiceCheck}
            disabled={isLoading}
            className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Test Service Check
          </button>
        </div>
        
        <div>
          <button
            onClick={testServiceStart}
            disabled={isLoading}
            className="bg-yellow-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Test Service Start
          </button>
        </div>
        
        {isLoading && (
          <div className="text-blue-500 font-medium">Loading...</div>
        )}
        
        {result && (
          <div className="p-2 bg-green-100 border border-green-300 rounded">
            <strong>Result:</strong> {result}
          </div>
        )}
        
        {error && (
          <div className="p-2 bg-red-100 border border-red-300 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default ServiceTestComponent;