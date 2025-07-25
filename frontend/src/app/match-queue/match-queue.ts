import { join } from "../../../../gamelogic/netcode/client";
import { inject, Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { leave } from "../../../../gamelogic/netcode/client";

@Component({
  selector: 'app-match-queue',
  imports: [],
  templateUrl: './match-queue.html',
  styleUrl: './match-queue.css',
  providers: []
})
export class MatchQueue {
  dots = "";
  message = '';
  private authService = inject(AuthService);

  constructor (private router: Router) {
    join(
      () => {
        this.router.navigate(['/game']);
      },
      () => {
        this.router.navigate(['/home']);
      },
      (scores: { name: string, score: number}[]) => {
        console.log("Game Ended!");
        console.log(scores);
        this.router.navigate(["/match"]);
      }
    );

    setInterval(() => {
      this.dots += ".";
    }, 5000);
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        leave();
        this.router.navigate(['/home']);
      },
      error: () => {
        leave();
        this.router.navigate(['/home']);
      }
    });
  }
  
  @HostListener("window:beforeunload")
  onUnload() {
    leave()
  }
}
