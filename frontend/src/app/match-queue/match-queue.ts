import { Component, inject } from '@angular/core';
import { WebSocketService } from '../web-socket-service';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-match-queue',
  imports: [],
  templateUrl: './match-queue.html',
  styleUrl: './match-queue.css',
  providers: [WebSocketService]
})
export class MatchQueue {
  wss = inject(WebSocketService);
  dots = "";
  message = '';

  constructor (private authService: AuthService, private router: Router) {
    this.wss.bindHandler("match.join", ({ matchId }) => {
      this.wss.unbindHandlers("match.join");
      router.navigate([matchId, "game"]);
    })

    this.wss.emit("match.joinRequest", { user: 0 });

    setInterval(() => {
      this.dots += ".";
    }, 5000);
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: () => {
        this.router.navigate(['/home']);
      }
    });
  }
}
