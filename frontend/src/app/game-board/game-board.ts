import { moveTo ,shootBullet, fetchFrame, getClientIdx, hasStarted, leave } from "../../../../gamelogic/netcode/client";
import { Sprite, GameState, Tank, Bullet, getWalls } from "../../../../gamelogic/gamelogic/game-state";
import { signal, Component, HostListener, computed } from "@angular/core";
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
  speechText = '';
  transcriptSub?: Subscription;
  leftCount = 0;
  rightCount = 0;
  upCount = 0;
  downCount = 0;
  lastIndex = -1;
  lastTranscript = '';
  shootCommand = '';
  resetTimeout?: any;
  isListening = false;

  clientTank = computed(() => {
    const idx = this.clientIdx;
    const tanks = this.tanks();
    return idx !== undefined ? tanks[idx] : undefined;
  });

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
    if (event.altKey)
      shootBullet(event.x, event.y);
    else
      moveTo(event.x, event.y);
  }

  @HostListener("window:beforeunload")
  onUnload() {
    leave()
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    const tank = this.clientTank();
    if (!tank) return;

    const currentX = tank.sprite.x;
    const currentY = tank.sprite.y;

    switch (event.key.toLowerCase()) {
      case 'w':
        moveTo(currentX, currentY - 50);
        break;
      case 'a':
        moveTo(currentX - 50, currentY);
        break;
      case 's':
        moveTo(currentX, currentY + 50);
        break;
      case 'd':
        moveTo(currentX + 50, currentY);
        break;
    }
  }
  ngOnInit() {
    /* ------------ START VOICE CONTROL BLOCK ------------- */
    this.speechService.startListening();


    this.transcriptSub = this.speechService.transcript$.subscribe(({ transcript, index }) => {
      if (transcript.length < this.lastTranscript.length || this.lastTranscript === transcript && this.lastIndex === index ) {
        return;
      } 
      this.speechText = transcript;

      let newTranscript = transcript;
      if (this.lastIndex === index) {
        newTranscript = transcript.replace(this.lastTranscript, '');
      }
      const tank = this.clientTank();
      if (!tank) return;

      const currentX = tank.sprite.x;
      const currentY = tank.sprite.y;
      if (transcript.toLowerCase().includes('left')) {
        moveTo(currentX - 50, currentY);
      }
      if (transcript.toLowerCase().includes('right')) {
       moveTo(currentX + 50, currentY);
      }
      if (transcript.toLowerCase().includes('up')) {
        moveTo(currentX, currentY - 50);
      }
      if (transcript.toLowerCase().includes('down')) {
        moveTo(currentX, currentY + 50);
      }

      this.lastIndex = index;
      this.lastTranscript = transcript;
      
      if (this.resetTimeout) {
        console.log("reset timeout")
        clearTimeout(this.resetTimeout);
      }

      this.resetTimeout = setTimeout(() => {
        console.log("cleared")
        this.lastTranscript = '';
        this.lastIndex = -1;
      }, 1500);

    });
     /* ------------ END VOICE CONTROL BLOCK ------------- */
  }
  toggleListening() {
    if (this.isListening) {
      this.speechService.stopListening();
    } else {
      this.speechService.startListening();
    }
    this.isListening = !this.isListening;
  }
}
