import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-how-to-play',
  templateUrl: './how-to-play.html',
  styleUrls: ['./how-to-play.css']
})
export class HowToPlay {
  title: string = 'How to Play WTanks';

  constructor(private router: Router) { }

  // Method to navigate back to the home page
  goHome(): void {
    this.router.navigate(['/']);
  }
}