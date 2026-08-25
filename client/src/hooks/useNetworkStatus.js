import { useState, useEffect } from "react";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSlow, setIsSlow] = useState(false);
  const [slowReason, setSlowReason] = useState("");
  const [slowSince, setSlowSince] = useState(null);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      setTimeout(() => setWasOffline(false), 3500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsSlow(false);
      setSlowSince(null);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check Network Information API if available (Chrome, Edge, Android)
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    const checkConnectionSpeed = () => {
      if (!connection) return;

      const slowTypes = ["slow-2g", "2g", "3g"];
      const isSlowType = slowTypes.includes(connection.effectiveType);
      const isHighRtt = connection.rtt && connection.rtt > 1200;

      if (isSlowType || isHighRtt) {
        setIsSlow(true);
        setSlowSince((current) => current || Date.now());
        setSlowReason(
          connection.effectiveType === "2g" || connection.effectiveType === "slow-2g"
            ? "Very slow network connection (2G)"
            : "High latency network detected"
        );
      } else {
        setIsSlow(false);
        setSlowReason("");
        setSlowSince(null);
      }
    };

    if (connection) {
      checkConnectionSpeed();
      connection.addEventListener("change", checkConnectionSpeed);
    }

    // Custom event listener for slow API calls (e.g. Render server waking up)
    const handleSlowApi = (e) => {
      setIsSlow(true);
      setSlowSince((current) => current || Date.now());
      setSlowReason(e.detail?.message || "Server taking longer to respond...");
    };

    const handleApiDone = () => {
      // If native connection is normal, clear slow state once requests finish
      if (!connection || (!["slow-2g", "2g"].includes(connection.effectiveType) && (connection.rtt || 0) < 1200)) {
        setIsSlow(false);
        setSlowReason("");
        setSlowSince(null);
      }
    };

    window.addEventListener("app:slow-network", handleSlowApi);
    window.addEventListener("app:network-ready", handleApiDone);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (connection) {
        connection.removeEventListener("change", checkConnectionSpeed);
      }
      window.removeEventListener("app:slow-network", handleSlowApi);
      window.removeEventListener("app:network-ready", handleApiDone);
    };
  }, []);

  return { isOnline, isSlow, slowReason, slowSince, wasOffline, setIsSlow };
}
