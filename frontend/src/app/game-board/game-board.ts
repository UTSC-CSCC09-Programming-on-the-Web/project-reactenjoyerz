import { moveTo ,shootBullet, fetchFrame, getClientIdx, hasStarted } from "../../../../gamelogic/netcode/client";
import { Sprite, GameState, Tank, Bullet, getWalls } from "../../../../gamelogic/gamelogic/game-state";
import { signal, Component } from "@angular/core";

@Component({
  selector: 'game-board',
  imports: [],
  templateUrl: './game-board.html',
  styleUrl: './game-board.css',
})
export class GameBoard {
  started = signal<boolean>(false);
  clientIdx?: number;
  tanks = signal<Tank[]>([]);
  bullets = signal<Bullet[]>([]);
  walls: Sprite[];

  constructor() {
    this.walls = getWalls();

    setInterval(() => {
      if (hasStarted() === false) return;

      const res = fetchFrame();
      this.started.set(true);
      this.clientIdx = getClientIdx();
      this.bullets.set(res.bullets);
      this.tanks.set(res.tanks);
    }, 20);
  }

  onClick(event: MouseEvent): void {
    if (event.altKey)
      shootBullet(event.x, event.y);
    else
      moveTo(event.x, event.y);
  }
}
