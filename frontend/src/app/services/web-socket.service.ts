import { Injectable } from '@angular/core';
import { io, Socket } from "socket.io-client";
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  delay = 0;
  socket: Socket;
  handlers: Map<string, Function[]>;

  constructor() {
    this.socket = io(environment.socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
    this.handlers = new Map();
    console.log("SHARED WebSocketService created and connecting...");
  }

  setDelay(d: number) {
    console.log(`setting delay = ${d}.`);
    this.delay = d;
  }

  bindHandler(event: string, handler: (data: any) => void) {
    const h = this.handlers.get(event);
    if (!h) {
      this.handlers.set(event, [handler]);

      this.socket.on(event, (v) => {
        const handlers = this.handlers.get(event);
        if (handlers) {
          setTimeout(() => {
            handlers.forEach((hh) => hh(v));
          }, this.delay);
        }
      });
    } else {
      h.push(handler);
    }
  }

  unbindHandlers(event: string) {
    this.socket.off(event);
  }

  emit(event: string, v: any, callback?: (response: any) => void) {
    setTimeout(() => {
      this.socket.emit(event, v, callback);
    }, this.delay);
  }
}
