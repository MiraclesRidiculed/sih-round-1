import { EventEmitter } from "events";

class LandStackEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  broadcast(eventType, payload) {
    const event = {
      id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: eventType,
      timestamp: new Date().toISOString(),
      payload
    };
    this.emit("dpi_event", event);
    return event;
  }
}

export const eventBus = new LandStackEventBus();
