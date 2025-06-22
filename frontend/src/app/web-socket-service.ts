import { Injectable } from '@angular/core';
import { io, Socket } from "socket.io-client";

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket; 
  private handlers: Map<string, Array<(v: any) => void>>;

  constructor() { 
    this.socket = io("http://localhost:8000");
    this.handlers = new Map<string, Array<(v: any) => void>>();
  }

  bindHandler(event: string, handler: (v: any) => void) {
    const h = this.handlers.get(event);
    if (!h) {
      this.handlers.set(event, [handler]);

      this.socket.on(event, (v) => {
        const handlers = this.handlers.get(event);
        if (handlers)
          handlers.forEach((hh) => {
            hh(v);
          })
      })
    }
    else
      h.push(handler);
  }

  unbindHandlers(event: string): void {
    this.socket.off(event);
  }

  emit(event: string, v: any, callback?: (v: any) => void) {
    this.socket.emit(event, v, callback);
  }
}
