import { createContext, useContext, useEffect, useRef, useState } from "react";

const LiveEventContext = createContext();

export const LiveEventProvider = ({ children }) => {
  const [gatewayStatus, setGatewayStatus] = useState("reconnecting"); // "connected", "reconnecting", "disconnected"
  const [recentEvents, setRecentEvents] = useState([]);
  const [activeToasts, setActiveToasts] = useState([]);
  const [lastEvent, setLastEvent] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const eventSourceRef = useRef(null);

  const addToast = (event) => {
    const toastId = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newToast = { id: toastId, ...event };

    setActiveToasts((prev) => [newToast, ...prev.slice(0, 3)]);

    setTimeout(() => {
      setActiveToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 5000);
  };

  const removeToast = (id) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    let reconnectTimeout = null;

    const connectSse = () => {
      setGatewayStatus("reconnecting");

      const es = new EventSource("/api/stream");
      eventSourceRef.current = es;

      es.onopen = () => {
        setGatewayStatus("connected");
      };

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          setLastEvent(data);
          setRecentEvents((prev) => [data, ...prev.slice(0, 19)]);
          setRefreshKey((k) => k + 1);

          if (data.type !== "SYSTEM_CONNECTED") {
            addToast(data);
          }
        } catch {
          // ignore non-json pings
        }
      };

      es.onerror = () => {
        setGatewayStatus("disconnected");
        es.close();
        reconnectTimeout = setTimeout(connectSse, 4000);
      };
    };

    connectSse();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  return (
    <LiveEventContext.Provider
      value={{
        gatewayStatus,
        recentEvents,
        activeToasts,
        lastEvent,
        refreshKey,
        removeToast
      }}
    >
      {children}
    </LiveEventContext.Provider>
  );
};

export const useLiveEvents = () => useContext(LiveEventContext);
