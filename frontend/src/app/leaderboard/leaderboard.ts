import { Component, signal } from '@angular/core';
import { Scores, hasStarted, fetchOldScores } from '../../../../gamelogic/netcode/client';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-leaderboard',
  imports: [],
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.css'
})
export class Leaderboard {
  started = signal<boolean>(false);
  scores = signal<Scores>([]);

  constructor(private readonly router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.started.set(hasStarted());
        const oldScores = fetchOldScores() ?? [];
        this.scores.set(oldScores.sort((a, b) => b.score - a.score));

        console.log("Game ended!")
      });
  }

  backButton() {
    this.router.navigate(["/game-select"]);
  }
}
