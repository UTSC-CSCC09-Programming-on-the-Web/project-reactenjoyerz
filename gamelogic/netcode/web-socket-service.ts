import { io, Socket } from "socket.io-client";

export class WebSocketService {
  private delay = 0;
  private socket: Socket;
  private handlers: Map<string, Array<(v: any) => void>>;

  constructor() {
    this.socket = io("http://localhost:8000");
    this.handlers = new Map<string, Array<(v: any) => void>>();
  }

  setDelay(d: number) {
    console.log(`setting delay = ${d}.`);
    this.delay = d;
  }

  bindHandler(event: string, handler: (v: any) => void) {
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

  unbindHandlers(event: string): void {
    this.socket.off(event);
  }

  emit(event: string, v: any, callback?: (v: any) => void) {
    console.log(`Sent ${event} event (delay = ${this.delay}) @ ${Date.now()} `);
    setTimeout(() => {
      this.socket.emit(event, v, callback);
    }, this.delay);
  }
}
