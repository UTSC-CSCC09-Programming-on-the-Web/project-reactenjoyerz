import { Component } from '@angular/core';
import { PlayerTank } from './tank/player-tank';
import { Bullet } from './bullet/bullet';
import { Wall } from './wall/wall';
import { EnemyTank } from './tank/enemy-tank';

@Component({
  selector: 'game-board',
  imports: [],
  templateUrl: './game-board.html',
  styleUrl: './game-board.css',
})
export class GameBoard {
  lastTime: number;
  bullets: Array<Bullet> = [];
  nextBulletId = 0;
  walls: Array<Wall> = [];
  playerTank: PlayerTank;
  enemyTanks: Array<EnemyTank> = [];

  constructor() {
    this.playerTank = new PlayerTank(0);
    this.enemyTanks.push(new EnemyTank(1));

    this.lastTime = Date.now();
    // push border walls in the first 4 indices of the array
    // so they aren't rendered

    this.walls.push(new Wall(0, 0, 192, 1, 10, -1));
    this.walls.push(new Wall(0, 950, 192, 1, 10, -1));
    this.walls.push(new Wall(0, 0, 1, 108, 10, -1));
    this.walls.push(new Wall(1910, 0, 1, 108, 10, -1));

    this.walls.push(new Wall(1000, 500, 10, 2, 48, 0));
    this.walls.push(new Wall(500, 50, 3, 15, 48, 1));

    setInterval(() => {
      const now: number = Date.now();
      const delta = now - this.lastTime;

      for (let i = this.bullets.length - 1; i >= 0; i--) {
        this.bullets[i].moveSprite(delta);
        for (const wall of this.walls)
          if (this.bullets[i].testCollisionWall(wall)) {
            this.bullets.splice(i, 1);
            break;
          }
      }

      this.walls.forEach((wall) => {
        this.playerTank.testCollisionWall(wall);
        this.enemyTanks.forEach((tank) => {
          tank.testCollisionWall(wall)
        });
      })

      this.playerTank.moveSprite(delta);
      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const bullet = this.bullets[j];
        if (this.playerTank.testCollisionBullet(bullet)) {
          this.bullets.splice(j, 1);
          break;
        }
      }

      for (let i = this.enemyTanks.length - 1; i >= 0; i--) {
        const tank = this.enemyTanks[i];
        tank.moveSprite(delta);

        for (let j = this.bullets.length - 1; j >= 0; j--) {
          const bullet = this.bullets[j];
          if (tank.testCollisionBullet(bullet)) {
            this.bullets.splice(j, 1);
            this.enemyTanks.splice(i, 1);
            break;
          }
        }
      }

      this.lastTime = now;
    }, 20);
  }

  onClick(event: MouseEvent): void {
    if (!this.playerTank.render) return;
    
    if (event.altKey)
      this.bullets.push(
        this.playerTank.shootBullet(event.x, event.y, this.nextBulletId++),
      );
    else this.playerTank.moveSpriteTo(event.x, event.y);
  }
}
