import { moveTo ,shootBullet, fetchFrame, getClientIdx, hasStarted, leave, setDirection, shootBulletVec, stop } from "../../../../gamelogic/netcode/client";
import { Sprite, GameState, Tank, Bullet, getWalls } from "../../../../gamelogic/gamelogic/game-state";
import { signal, Component, HostListener, computed, Host } from "@angular/core";
import { SpeechService } from '../services/speech';
import { Subscription } from 'rxjs';

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

  constructor(private speechService: SpeechService) {
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
    shootBullet(event.x, event.y);
  }

  @HostListener('window:beforeunload')
  onUnload() {
    leave();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    switch (event.key.toLowerCase()) {
      case 'w':
        setDirection(0, -1);
        break;
      case 'a':
        setDirection(-1, 0);
        break;
      case 's':
        setDirection(0, 1);
        break;
      case 'd':
        setDirection(1, 0);
        break;
      case 'v':
        this.startRecording();
        break;
    }
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyUp(event: KeyboardEvent) {
    switch (event.key.toLowerCase()) {
      case 'w':
      case 'a':
      case 's':
      case 'd':
        stop();
        break;
      case 'm':
        this.stopRecording();
        break;
    }
  }

  startRecording() {
    this.speechService.startListening((transcript: string) => {
      if (transcript.toLowerCase().includes("stop")) {
        stop();
        return;
      }

      const advCmd = transcript
        .toLowerCase()
        .match(
          /(shoot|move) ([0-9]+)(?:° | degrees )?(north|south).?(east|west)/
        );
      const smpCmd = transcript
        .toLowerCase()
        .match(/(shoot|move) (north|east|south|west)/);

      let dx = 0;
      let dy = 0;
      let action = '';

      if (advCmd) {
        action = advCmd[1];
        const radians = (Number.parseInt(advCmd[2]) * Math.PI) / 180;

        dy = advCmd[3] === 'north' ? -1 : 1;
        switch (advCmd[4]) {
          case 'east':
            dx = dy * Math.sin(radians);
            dy = dy * Math.cos(radians);
            break;
          case 'west':
            dx = -dy * Math.sin(radians);
            dy = dy * Math.cos(radians);
            break;
        }
      } else if (smpCmd) {
        action = smpCmd[1];

        switch (smpCmd[2]) {
          case 'north':
            dy = -1;
            break;
          case 'south':
            dy = 1;
            break;
          case 'east':
            dx = 1;
            break;
          case 'west':
            dx = -1;
        }
      } else {
        console.error('the impossible just happended!');
      }

      if (action === 'shoot') shootBulletVec(dx, dy);
      else if (action === 'move') setDirection(dx, dy);
    });
  }

  stopRecording() {
    this.speechService.stopListening();
  }
}
