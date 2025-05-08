import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";

function ServiceStatusIndicator() {
  const { t } = useTranslation();
  const [isRunning, setIsRunning] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [debugMessages, setDebugMessages] = useState([]);

  // Helper function to add debug messages
  const addDebugMessage = (message) => {
    console.log(`[Service Debug]: ${message}`);
    setDebugMessages((prev) => [...prev, { time: new Date().toLocaleTimeString(), message }]);
  };

  // Improved checkStatus function 
  const checkStatus = async (force = false) => {
    // Only skip if we're already in progress and this isn't a forced check
    if ((isChecking || isStarting) && !force) {
      addDebugMessage("Already checking or starting, skipping status check");
      return;
    }
    
    addDebugMessage("Starting service status check...");
    setIsChecking(true);
    
    try {
      addDebugMessage("Invoking Rust check_service_status command");
      
      // Create a timeout promise to race against the actual check
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout: Service check taking too long")), 10000);
      });
      
      // Race the actual check against the timeout
      const status = await Promise.race([
        invoke("check_service_status"),
        timeoutPromise
      ]);
      
      addDebugMessage(`Service status check result: ${status}`);
      setIsRunning(status);
      setError(null);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      addDebugMessage(`Failed to check service status: ${err}`);
      console.error("Service check error:", err);
      setError(err.toString());
      setIsRunning(false);
    } finally {
      // Ensure we always exit the checking state
      setIsChecking(false);
      addDebugMessage("Service status check completed");
    }
  };

  const startService = async () => {
    if (isStarting) {
      addDebugMessage("Already starting service, ignoring request");
      return; // Prevent multiple start attempts
    }
    
    setIsStarting(true);
    setError(null);
    addDebugMessage("Starting service...");
    
    try {
      addDebugMessage("Invoking start_service command");
      
      // Create a timeout promise to race against the actual start
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout: Service start taking too long")), 15000);
      });
      
      // Race the actual start against the timeout
      await Promise.race([
        invoke("start_service"),
        timeoutPromise
      ]);
      
      addDebugMessage("Service start command sent, waiting before checking status");
      
      // Use setTimeout with a Promise to properly handle async flow
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Force a status check regardless of current state
      await checkStatus(true);
    } catch (err) {
      addDebugMessage(`Failed to start service: ${err}`);
      console.error("Service start error:", err);
      setError(err.toString());
      setIsRunning(false);
    } finally {
      // Ensure we always exit the starting state
      setIsStarting(false);
      addDebugMessage("Service start attempt completed");
    }
  };

  // Component mount effect
  useEffect(() => {
    addDebugMessage("ServiceStatusIndicator mounted, performing initial check");
    
    // Initial check with slight delay
    const initialCheckTimeout = setTimeout(() => {
      checkStatus();
    }, 1000);
    
    // Set up interval for periodic checks
    const intervalId = setInterval(() => {
      addDebugMessage("Periodic service status check");
      checkStatus();
    }, 30000); // Check every 30 seconds
    
    // Cleanup function
    return () => {
      addDebugMessage("ServiceStatusIndicator unmounting, clearing timers");
      clearTimeout(initialCheckTimeout);
      clearInterval(intervalId);
    };
  }, []); // No dependencies to avoid re-running effect

  // Determine indicator color and text
  const getIndicatorColor = () => {
    if (isChecking || isStarting) return "bg-yellow-500";
    if (error) return "bg-red-500";
    return isRunning ? "bg-green-500" : "bg-red-500";
  };

  const getStatusText = () => {
    if (isStarting) return t("service.starting", "Starting...");
    if (isChecking) return t("service.checking", "Checking status...");
    if (error) return t("service.error", "Status check failed");
    return isRunning 
      ? t("service.running", "Running") 
      : t("service.stopped", "Stopped");
  };

  // Toggle for debug panel visibility
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="bg-brand-white p-4 rounded-lg shadow-md">
      <div className="flex items-center justify-between flex-col md:flex-row space-y-3 md:space-y-0">
        <div className="flex items-center">
          <div className="mr-3">
            <div
              className={`w-6 h-6 rounded-full ${getIndicatorColor()}`}
            />
          </div>
          <div>
            <h3 className="font-semibold text-onyx-600">
              {t("service.name", "ConnectorSageBitrix Service")}: {getStatusText()}
            </h3>
            {lastChecked && !isChecking && (
              <p className="text-xs text-onyx-400">
                Last checked: {lastChecked}
              </p>
            )}
            {error && (
              <p className="text-red-500 text-sm mt-1">
                {error.includes("Access is denied") 
                  ? t("service.accessDenied", "Administrator privileges required to control the service")
                  : error.includes("not found")
                  ? t("service.notFound", "Service not found. Make sure it's installed.")
                  : error.includes("Timeout")
                  ? "Operation timed out. The service may be busy or unresponsive."
                  : error}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          {!isRunning && !isStarting && (
            <button
              onClick={startService}
              className="bg-onyx-500 hover:bg-onyx-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              disabled={isStarting || isChecking}
            >
              {isStarting 
                ? t("service.startingButton", "Starting...") 
                : t("service.startButton", "Start Service")}
            </button>
          )}
          
          <button
            onClick={() => checkStatus(true)}
            className="bg-onyx-300 hover:bg-onyx-400 text-onyx-800 font-bold py-2 px-4 rounded disabled:opacity-50"
            disabled={isChecking}
          >
            {isChecking 
              ? t("service.checkingButton", "Checking...") 
              : t("service.refresh", "Refresh")}
          </button>
          
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-2 rounded"
          >
            {showDebug ? "Hide Debug" : "Show Debug"}
          </button>
        </div>
      </div>
      
      {/* Debug panel */}
      {showDebug && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-60">
          <h4 className="font-bold mb-1">Debug Log:</h4>
          <ul className="space-y-1">
            {debugMessages.map((msg, idx) => (
              <li key={idx} className="text-gray-700">
                <span className="text-gray-500">[{msg.time}]</span> {msg.message}
              </li>
            ))}
            {debugMessages.length === 0 && <li>No debug messages yet.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ServiceStatusIndicator;