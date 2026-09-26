import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

const LiveEventContext = createContext();

export const LiveEventProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [gatewayStatus, setGatewayStatus] = useState("reconnecting"); // "connected", "reconnecting", "disconnected"
  const [recentEvents, setRecentEvents] = useState([]);
  const [activeToasts, setActiveToasts] = useState([]);
  const [lastEvent, setLastEvent] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const requestControllerRef = useRef(null);

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
    let disposed = false;

    const connectSse = async () => {
      if (!isAuthenticated || user?.role !== "admin") {
        setGatewayStatus("disconnected");
        return;
      }

      setGatewayStatus("reconnecting");
      const controller = new AbortController();
      requestControllerRef.current = controller;
      try {
        const response = await fetch("/api/stream", {
          credentials: "include",
          signal: controller.signal
        });
        if (response.status === 401) {
          window.dispatchEvent(new CustomEvent("landstack:session-invalid", {
            detail: { message: "Your session has expired. Please sign in again." }
          }));
          setGatewayStatus("disconnected");
          return;
        }
        if (response.status === 403) {
          window.dispatchEvent(new CustomEvent("landstack:access-denied", {
            detail: { message: response.statusText || "You are not authorized to receive administrative events." }
          }));
          setGatewayStatus("disconnected");
          return;
        }
        if (!response.ok || !response.body) {
          throw new Error(`Administrative event stream failed with status ${response.status}.`);
        }
        setGatewayStatus("connected");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (!disposed) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split(/\r?\n\r?\n/);
          buffer = frames.pop() || "";
          for (const frame of frames) {
            const data = frame
              .split(/\r?\n/)
              .filter((line) => line.startsWith("data:"))
              .map((line) => line.slice(5).trim())
              .join("\n");
            if (!data) continue;
            try {
              const event = JSON.parse(data);
              setLastEvent(event);
              setRecentEvents((previous) => [event, ...previous.slice(0, 19)]);
              setRefreshKey((key) => key + 1);
              if (event.type !== "SYSTEM_CONNECTED") addToast(event);
            } catch {
              // Ignore malformed or non-JSON SSE frames.
            }
          }
        }
        if (!disposed) throw new Error("Administrative event stream closed.");
      } catch (error) {
        if (error.name === "AbortError" || disposed) return;
        setGatewayStatus("disconnected");
        reconnectTimeout = setTimeout(connectSse, 4000);
      }
    };

    connectSse();

    return () => {
      disposed = true;
      requestControllerRef.current?.abort();
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [isAuthenticated, user?.role]);

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
