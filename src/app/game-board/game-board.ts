import { Component, inject } from '@angular/core';
import { PlayerTank } from './tank/player-tank';
import { Bullet } from './bullet/bullet';

@Component({
  selector: 'game-board',
  imports: [],
  templateUrl: './game-board.html',
  styleUrl: './game-board.css',
})
export class GameBoard {
  playerTank: PlayerTank;
  lastTime: number;
  bullets: Array<Bullet> = [];
  nextBulletId = 0;

  constructor() {
    this.playerTank = new PlayerTank(0);
    this.lastTime = Date.now();

    setInterval(() => {
      const now: number = Date.now();
      const delta = now - this.lastTime;
      this.playerTank.moveSprite(delta);

      for (let i = this.bullets.length - 1; i >= 0; i--) {
        this.bullets[i].moveSprite(delta);
        if (this.bullets[i].collidesWith(this.playerTank))
          this.bullets.splice(i, 1);
      }

      this.lastTime = now;
    }, 20);
  }

  onClick(event: MouseEvent): void {
    if (event.altKey)
      this.bullets.push(
        this.playerTank.shootBullet(event.x, event.y, this.nextBulletId++),
      );
    else this.playerTank.moveSpriteTo(event.x, event.y);
  }
}
