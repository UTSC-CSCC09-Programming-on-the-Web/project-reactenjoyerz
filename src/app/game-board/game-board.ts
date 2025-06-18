import { Component, inject } from '@angular/core';
import { PlayerTank } from './tank/player-tank';
import { Bullet } from './bullet/bullet';
import { Wall } from './wall/wall';

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
  walls: Array<Wall> = [];

  constructor() {
    this.playerTank = new PlayerTank(0);
    this.lastTime = Date.now();
    this.walls.push(new Wall(1000, 500, 10, 2, 48, 0));
    this.walls.push(new Wall(500, 50, 3, 15, 48, 1));

    setInterval(() => {
      const now: number = Date.now();
      const delta = now - this.lastTime;

      this.walls.forEach((wall) => {
        this.playerTank.testCollision(wall);
      })

      this.playerTank.moveSprite(delta);

      for (let i = this.bullets.length - 1; i >= 0; i--) {
        this.bullets[i].moveSprite(delta);
        for (const wall of this.walls)
          if (this.bullets[i].testCollision(wall))
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
