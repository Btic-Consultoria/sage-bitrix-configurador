import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";

function ServiceStatusIndicator() {
  const { t } = useTranslation();
  const [isRunning, setIsRunning] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

  const checkStatus = useCallback(async () => {
    if (isChecking || isStarting) {
      console.log("Already checking or starting, skipping status check");
      return; // Prevent multiple simultaneous checks
    }
    
    console.log("Starting service status check...");
    setIsChecking(true);
    try {
      console.log("Invoking Rust check_service_status command");
      const status = await invoke("check_service_status");
      console.log("Service status check result:", status);
      setIsRunning(status);
      setError(null);
    } catch (err) {
      console.error("Failed to check service status:", err);
      setError(err.toString());
    } finally {
      setIsChecking(false);
      console.log("Service status check completed");
    }
  }, [isChecking, isStarting]);

  const startService = async () => {
    setIsStarting(true);
    setError(null);
    try {
      await invoke("start_service");
      // Wait a moment for the service to start
      setTimeout(async () => {
        await checkStatus();
        setIsStarting(false);
      }, 2000);
    } catch (err) {
      setError(err.toString());
      console.error("Failed to start service:", err);
      setIsStarting(false);
    }
  };

  useEffect(() => {
    console.log("ServiceStatusIndicator mounted, performing initial check");
    
    // Use a small timeout for the initial check to ensure component is fully mounted
    const initialCheckTimeout = setTimeout(() => {
      checkStatus();
    }, 500);
    
    // Set up interval for periodic checks
    const intervalId = setInterval(() => {
      console.log("Periodic service status check");
      checkStatus();
    }, 30000); // Check every 30 seconds
    
    // Cleanup function
    return () => {
      console.log("ServiceStatusIndicator unmounting, clearing timers");
      clearTimeout(initialCheckTimeout);
      clearInterval(intervalId);
    };
  }, [checkStatus]); // Added checkStatus as dependency

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

  return (
    <div className="bg-brand-white p-4 rounded-lg shadow-md">
      <div className="flex items-center justify-between">
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
            {error && (
              <p className="text-red-500 text-sm mt-1">
                {error.includes("Access is denied") 
                  ? t("service.accessDenied", "Administrator privileges required to control the service")
                  : error}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          {!isRunning && !isChecking && !isStarting && (
            <button
              onClick={startService}
              className="bg-onyx-500 hover:bg-onyx-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              disabled={isStarting}
            >
              {isStarting 
                ? t("service.startingButton", "Starting...") 
                : t("service.startButton", "Start Service")}
            </button>
          )}
          
          {!isChecking && !isStarting && (
            <button
              onClick={checkStatus}
              className="bg-onyx-300 hover:bg-onyx-400 text-onyx-800 font-bold py-2 px-4 rounded"
              disabled={isChecking || isStarting}
            >
              {t("service.refresh", "Refresh")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ServiceStatusIndicator;