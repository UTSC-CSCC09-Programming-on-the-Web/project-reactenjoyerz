import { io, Socket } from "socket.io-client";

export class WebSocketService {
  delay = 0;
  socket;
  handlers;

  constructor() {
    this.socket = io("http://localhost:8000", {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
    this.handlers = new Map();
  }

  setDelay(d) {
    console.log(`setting delay = ${d}.`);
    this.delay = d;
  }

  bindHandler(event, handler) {
    const h = this.handlers.get(event);
    if (!h) {
      this.handlers.set(event, [handler]);

      this.socket.on(event, (v) => {
        const handlers = this.handlers.get(event);
        if (handlers) {
          setTimeout(() => {
            console.log(`Received ${event} event (delay = ${this.delay}) @ ${Date.now()}`);
            handlers.forEach((hh) => {
              hh(v);
            });
          }, this.delay)
        }
      })
    }
    else
      h.push(handler);
  }

  unbindHandlers(event) {
    this.socket.off(event);
  }

  emit(event, v, callback) {
    console.log(`Sent ${event} event (delay = ${this.delay}) @ ${Date.now()} `);
    setTimeout(() => {
      this.socket.emit(event, v, callback);
    }, this.delay);
  }
}
