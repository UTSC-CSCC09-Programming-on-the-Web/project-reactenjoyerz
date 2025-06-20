import { Component, inject } from '@angular/core';
import { WebSocketService } from '../web-socket-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-match-queue',
  imports: [],
  templateUrl: './match-queue.html',
  styleUrl: './match-queue.css',
  providers: [WebSocketService]
})
export class MatchQueue {
  wss = inject(WebSocketService);
  dots = ""

  constructor (private router: Router) {
    this.wss.bindHandler("match.join", ({ matchId }) => {
      this.wss.unbindHandlers("match.join");
      router.navigate([matchId, "game"]);
    })

    this.wss.emit("match.joinRequest", { user: 0 });

    setInterval(() => {
      this.dots += ".";
    }, 5000);
  }
}
