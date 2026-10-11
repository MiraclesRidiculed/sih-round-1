import { eventBus } from "../events/eventBus.js";

const activeClients = new Set();

export const handleSseStream = (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });

  const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  activeClients.add(clientId);

  // Send initial handshake
  res.write(
    `data: ${JSON.stringify({
      type: "SYSTEM_CONNECTED",
      clientId,
      timestamp: new Date().toISOString(),
      message: "Connected to the administrative event stream."
    })}\n\n`
  );

  // Event listener
  const listener = (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  eventBus.on("dpi_event", listener);

  // Heartbeat ping every 20 seconds
  const heartbeat = setInterval(() => {
    res.write(`: ping\n\n`);
  }, 20000);

  req.on("close", () => {
    clearInterval(heartbeat);
    eventBus.off("dpi_event", listener);
    activeClients.delete(clientId);
  });
};

export const getStreamStatus = (req, res) => {
  res.json({
    status: "active",
    gateway: "Land Stack DPI Event Gateway",
    connectedClients: activeClients.size,
    timestamp: new Date().toISOString()
  });
};

export const simulateDpiEvent = (req, res) => {
  const { eventType, payload = {} } = req.body;

  if (!eventType) {
    return res.status(400).json({ message: "eventType is required" });
  }

  const broadcastEvent = eventBus.broadcast(eventType, {
    ...payload,
    simulated: true,
    triggeredAt: new Date().toISOString()
  });

  res.json({
    message: `DPI event ${eventType} broadcast successfully across agencies`,
    event: broadcastEvent
  });
};
