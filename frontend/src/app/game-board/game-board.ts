import { moveTo ,shootBullet, fetchFrame, getClientIdx } from "../../../../gamelogic/netcode/client";
import { Sprite } from "../../../../gamelogic/gamelogic/sprite";
import { createWall } from "../../../../gamelogic/gamelogic/wall";
import { GameState } from "../../../../gamelogic/gamelogic/game-state";
import { Component } from "@angular/core";

@Component({
  selector: 'game-board',
  imports: [],
  templateUrl: './game-board.html',
  styleUrl: './game-board.css',
})
export class GameBoard {
  clientIdx: number;
  currentState?: GameState;
  walls: Sprite[];

  constructor() {
    this.clientIdx = getClientIdx();
    this.walls = [
      createWall(0, 0, 192, 1, 48),
      createWall(0, 950, 192, 1, 48),
      createWall(0, 0, 1, 108, 48),
      createWall(1910, 0, 1, 108, 48),
      createWall(1000, 500, 10, 2, 48),
      createWall(500, 50, 3, 15, 48),
    ];

    setInterval(() => {
      this.currentState = fetchFrame();
    }, 20);
  }

  onClick(event: MouseEvent): void {
    if (event.altKey) {
      shootBullet(event.x, event.y);
    } else {
      moveTo(event.x, event.y);
    }
  }
}
