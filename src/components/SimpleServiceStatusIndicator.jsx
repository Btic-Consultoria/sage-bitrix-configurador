import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

function SimpleServiceStatusIndicator() {
  const { t } = useTranslation();
  const [status, setStatus] = useState("unknown"); // "unknown", "running", "stopped", "error"
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    console.log(`[Service]: ${message}`);
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message }]);
  };

  const checkServiceStatus = async () => {
    // Only start checking if we're not already checking
    if (isLoading) {
      addLog("Already checking status, skipping");
      return;
    }

    addLog("Checking service status...");
    setIsLoading(true);

    try {
      // Import the invoke function only when needed
      const { invoke } = await import("@tauri-apps/api/core");
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        const id = setTimeout(() => {
          clearTimeout(id);
          reject(new Error("Service check timed out after 8 seconds"));
        }, 8000);
      });
      
      // Race the actual check vs timeout
      const isRunning = await Promise.race([
        invoke("check_service_status"),
        timeoutPromise
      ]);
      
      addLog(`Service status result: ${isRunning}`);
      setStatus(isRunning ? "running" : "stopped");
      setErrorMsg("");
      setLastChecked(new Date().toLocaleTimeString());
    } catch (error) {
      addLog(`Error checking service: ${error.toString()}`);
      setStatus("error");
      setErrorMsg(error.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const startService = async () => {
    if (isLoading) {
      addLog("Operation in progress, please wait");
      return;
    }

    addLog("Starting service...");
    setIsLoading(true);

    try {
      // Import the invoke function only when needed
      const { invoke } = await import("@tauri-apps/api/core");
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        const id = setTimeout(() => {
          clearTimeout(id);
          reject(new Error("Service start timed out after 10 seconds"));
        }, 10000);
      });
      
      // Race the actual start vs timeout
      await Promise.race([
        invoke("start_service"),
        timeoutPromise
      ]);
      
      addLog("Service start command sent");
      
      // Wait a moment before checking status
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check status after starting
      addLog("Checking status after start attempt");
      await checkServiceStatus();
    } catch (error) {
      addLog(`Error starting service: ${error.toString()}`);
      setStatus("error");
      setErrorMsg(error.toString());
      setIsLoading(false);
    }
  };

  // Initial check and periodic checks
  useEffect(() => {
    addLog("Component mounted");
    
    // Initial check with slight delay
    const delayedCheck = setTimeout(() => {
      addLog("Running initial service check");
      checkServiceStatus();
    }, 1000);
    
    // Set up interval for periodic checks
    const intervalId = setInterval(() => {
      addLog("Periodic service status check");
      checkServiceStatus();
    }, 30000); // Check every 30 seconds
    
    // Cleanup function
    return () => {
      addLog("Component unmounting");
      clearTimeout(delayedCheck);
      clearInterval(intervalId);
    };
  }, []);

  // Status indicator color
  const getStatusColor = () => {
    switch (status) {
      case "running": return "bg-green-500";
      case "stopped": return "bg-red-500";
      case "error": return "bg-red-500";
      default: return isLoading ? "bg-yellow-500" : "bg-gray-500";
    }
  };

  // Status text
  const getStatusText = () => {
    if (isLoading) {
      return t("service.checking", "Checking status...");
    }
    
    switch (status) {
      case "running": return t("service.running", "Running");
      case "stopped": return t("service.stopped", "Stopped");
      case "error": return t("service.error", "Status check failed");
      default: return "Unknown";
    }
  };

  // Simplified UI
  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <div className="flex flex-col space-y-4">
        {/* Status indicator */}
        <div className="flex items-center">
          <div className={`w-4 h-4 rounded-full ${getStatusColor()} mr-2`}></div>
          <span className="font-medium">
            {t("service.name", "ConnectorSageBitrix Service")}: {getStatusText()}
          </span>
        </div>
        
        {/* Error message */}
        {status === "error" && (
          <div className="text-red-500 text-sm">
            {errorMsg.includes("Access is denied") 
              ? t("service.accessDenied", "Administrator privileges required")
              : errorMsg.includes("not found")
              ? t("service.notFound", "Service not found")
              : errorMsg.includes("timed out")
              ? "Operation timed out. The service may be busy."
              : errorMsg}
          </div>
        )}
        
        {/* Last checked time */}
        {lastChecked && (
          <div className="text-xs text-gray-500">
            Last checked: {lastChecked}
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex space-x-2">
          {status === "stopped" && !isLoading && (
            <button 
              onClick={startService}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm disabled:opacity-50"
            >
              {t("service.startButton", "Start Service")}
            </button>
          )}
          
          <button
            onClick={checkServiceStatus}
            disabled={isLoading}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded text-sm disabled:opacity-50"
          >
            {isLoading ? t("service.checkingButton", "Checking...") : t("service.refresh", "Refresh")}
          </button>
        </div>
        
        {/* Debug logs */}
        <div className="mt-2">
          <details>
            <summary className="text-sm text-blue-500 cursor-pointer">
              Show Debug Logs
            </summary>
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs max-h-40 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className="text-gray-700">
                  <span className="text-gray-500">[{log.time}]</span> {log.message}
                </div>
              ))}
              {logs.length === 0 && <div>No logs yet</div>}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

export default SimpleServiceStatusIndicator;