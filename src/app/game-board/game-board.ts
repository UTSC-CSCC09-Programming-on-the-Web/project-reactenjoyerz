import { Component, inject } from '@angular/core';
import { PlayerTank } from './tank/player-tank';
import { DynamicSprite } from './dynamic-sprite';

@Component({
  selector: 'game-board',
  imports: [],
  templateUrl: './game-board.html',
  styleUrl: './game-board.css',
})
export class GameBoard {
  playerTank: PlayerTank;
  lastTime: number;
  constructor() {
    this.playerTank = new PlayerTank(0);
    this.lastTime = Date.now();

    setInterval(() => {
      const now: number = Date.now();
      this.playerTank.moveSprite(now - this.lastTime);
      this.lastTime = now;
    }, 5);
  }

  onClick(event: MouseEvent): void {
    if (event.altKey)
      this.playerTank.shootBullet(event.x, event.y);
    else
      this.playerTank.moveSpriteTo(event.x, event.y);
  }
}
