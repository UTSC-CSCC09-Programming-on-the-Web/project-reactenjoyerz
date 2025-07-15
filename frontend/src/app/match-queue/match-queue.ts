import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { WebSocketService } from '../web-socket-service';
import { VoiceService } from '../services/voice.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-match-queue',
  imports: [],
  templateUrl: './match-queue.html',
  styleUrl: './match-queue.css',
  // providers: [WebSocketService]
})
export class MatchQueue implements OnInit, OnDestroy {
  wss = inject(WebSocketService);
  voiceService = inject(VoiceService); // Inject VoiceService
  dots = "";
  message = 'Finding a match...';
  private intervalId: any;

  constructor (private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.wss.bindHandler("match.found", 
      ({ matchId, peerIds }: { matchId: string, peerIds: string[] }) => {
      this.message = 'Match Found! Starting voice chat...';
      console.log('Match found with peers:', peerIds);

      this.router.navigate([matchId, 'game'], { 
        state: { peers: peerIds } 
      });
    });

    this.wss.emit("match.joinRequest", {});

    this.intervalId = setInterval(() => {
      this.dots = this.dots.length >= 3 ? "" : this.dots + ".";
    }, 1000);
  }

  ngOnDestroy() {
    this.wss.unbindHandlers("match.found");
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
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