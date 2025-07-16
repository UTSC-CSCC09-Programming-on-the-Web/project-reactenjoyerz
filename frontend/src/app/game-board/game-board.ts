import { moveTo ,shootBullet, fetchFrame, getClientIdx, hasStarted, leave, getDistance, getClientInfo} from "../../../../gamelogic/netcode/client";
import { Sprite, GameState, Tank, Bullet, getWalls } from "../../../../gamelogic/gamelogic/game-state";
import { signal, Component, HostListener, computed, OnDestroy, OnInit} from "@angular/core";
import { SpeechService } from '../services/speech';
import { VoiceChatService } from '../services/voice-chat';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { WebSocketService } from '../services/web-socket.service';
import {initClient} from "../../../../gamelogic/netcode/client"; 


const MAX_PROXIMITY_DISTANCE = 500;
const MIN_AUDIBLE_DISTANCE = 50;

@Component({
  selector: 'game-board',
  imports: [CommonModule], 
  templateUrl: './game-board.html',
  styleUrl: './game-board.css',
})
export class GameBoard implements OnInit, OnDestroy {
  started = signal<boolean>(false);
  clientIdx?: number;
  tanks = signal<Tank[]>([]);
  bullets = signal<Bullet[]>([]);
  walls: Sprite[];
  speechText = '';
  transcriptSub?: Subscription;
  // leftCount = 0;
  // rightCount = 0;
  // upCount = 0;
  // downCount = 0;
  lastIndex = -1;
  lastTranscript = '';
  shootCommand = '';
  resetTimeout?: any;
  isListening = false;


  isVoiceTransmitting = false;
  speakingPlayers: Set<number> = new Set();
  playerVolumes: Map<number, number> = new Map();
  playerMutedStatus: Map<number, boolean> = new Map();

  micAccessStatus: 'idle' | 'granted' | 'denied' | 'error' = 'idle';
  private micStatusSub?: Subscription;

  private currentMatchGameId: number | null = null;

  private voiceTransmittingSub?: Subscription;
  private voiceReceivingSub?: Subscription;

  clientTank = computed(() => {
    const idx = this.clientIdx;
    const tanks = this.tanks();
    return idx !== undefined ? tanks[idx] : undefined;
  });

  private clientInfoSet = false;

  constructor(private speechService: SpeechService, private voiceChatService: VoiceChatService, private wss: WebSocketService) {
    initClient(wss);
    this.walls = getWalls();

    setInterval(() => {
      if (!hasStarted()) {
        if (this.started()) {
            this.started.set(false);
        }
        return;
      }

      const res = fetchFrame();
      this.started.set(true);
      this.clientIdx = getClientIdx();
      this.bullets.set(res.bullets);
      this.tanks.set(res.tanks);

      if (this.clientIdx !== undefined && !this.clientInfoSet) {
        this.voiceChatService.setClient(getClientInfo());
        this.clientInfoSet = true;
      }

      // --- Proximity Chat Volume Adjustment ---
      const currentClientIdx = this.clientIdx;
      if (currentClientIdx !== undefined) {
        this.tanks().forEach((_tank, idx) => { // Iterate through all tanks
          if (idx === currentClientIdx) return; // Don't adjust own volume

          // Check if player is explicitly muted by the user
          if (this.playerMutedStatus.get(idx)) {
            this.voiceChatService.setPlayerVolume(idx, 0); // Mute completely
            return;
          }

          // Calculate distance to other player
          const distance = getDistance(idx);

          // Apply proximity-based volume falloff
          let proximityVolume = 1;
          if (distance > MAX_PROXIMITY_DISTANCE) {
            proximityVolume = 0; // Silent if outside max range
          } else if (distance > MIN_AUDIBLE_DISTANCE) {
            // Linear falloff from 1 at MIN_AUDIBLE_DISTANCE to 0 at MAX_PROXIMITY_DISTANCE
            proximityVolume = 1 - ((distance - MIN_AUDIBLE_DISTANCE) / (MAX_PROXIMITY_DISTANCE - MIN_AUDIBLE_DISTANCE));
          }
          // Clamp to ensure valid range (0 to 1)
          proximityVolume = Math.max(0, Math.min(1, proximityVolume));

          // Combine with user-set volume (if any)
          const userSetVolume = this.playerVolumes.get(idx) ?? 1; // Default to 1 if not set
          const finalVolume = proximityVolume * userSetVolume;

          this.voiceChatService.setPlayerVolume(idx, finalVolume);
        });
      }
      // --- End Proximity Chat Volume Adjustment ---

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
     this.voiceTransmittingSub = this.voiceChatService.isTransmitting.subscribe(status => {
      this.isVoiceTransmitting = status;
    });

    this.voiceReceivingSub = this.voiceChatService.isReceivingAudio.subscribe(({ clientIdx, isTalking }) => {
      if (isTalking) {
        this.speakingPlayers.add(clientIdx);
      } else {
        this.speakingPlayers.delete(clientIdx);
      }
    });
  }

  ngOnDestroy() {
    // Clean up all subscriptions to prevent memory leaks
    if (this.transcriptSub) {
      this.transcriptSub.unsubscribe();
    }
    if (this.voiceTransmittingSub) {
      this.voiceTransmittingSub.unsubscribe();
    }
    if (this.voiceReceivingSub) {
      this.voiceReceivingSub.unsubscribe();
    }

    // Stop listening and transmitting when component is destroyed
    this.speechService.stopListening();
    this.voiceChatService.stopTransmitting();
    leave(); // Call game leave logic from client.ts
  }

  toggleListening() {
    if (this.isListening) {
      this.speechService.stopListening();
    } else {
      this.speechService.startListening();
    }
    this.isListening = !this.isListening;
  }

  // toggleVoiceTransmission(): void {
  //   if (this.isVoiceTransmitting) {
  //     this.voiceChatService.stopTransmitting();
  //   } else {
  //     this.voiceChatService.startTransmitting();
  //   }
  // }

  togglePlayerMute(playerIdx: number): void {
    const isMuted = this.playerMutedStatus.get(playerIdx) ?? false;
    this.playerMutedStatus.set(playerIdx, !isMuted);

    // Immediately update volume to reflect mute/unmute
    if (!isMuted) {
      this.voiceChatService.setPlayerVolume(playerIdx, 0);
    } else {
      // Re-evaluate volume based on user-set and proximity
      const currentClientIdx = this.clientIdx;
      if (currentClientIdx !== undefined) {
        const distance = getDistance(playerIdx);
        let proximityVolume = 1;
        if (distance > MAX_PROXIMITY_DISTANCE) {
          proximityVolume = 0;
        } else if (distance > MIN_AUDIBLE_DISTANCE) {
          proximityVolume = 1 - ((distance - MIN_AUDIBLE_DISTANCE) / (MAX_PROXIMITY_DISTANCE - MIN_AUDIBLE_DISTANCE));
        }
        proximityVolume = Math.max(0, Math.min(1, proximityVolume));
        const userSetVolume = this.playerVolumes.get(playerIdx) ?? 1;
        this.voiceChatService.setPlayerVolume(playerIdx, proximityVolume * userSetVolume);
      }
    }
  }

  toggleVoiceTransmission(): void {
  // The isVoiceTransmitting property comes from your subscription to the voice chat service
  if (this.isVoiceTransmitting) {
    // If we are currently talking, just stop the voice chat.
    this.voiceChatService.stopTransmitting();
    this.speechService.startListening();
  } else {
    this.speechService.stopListening();
    this.voiceChatService.startTransmitting();
  }
}

  setPlayerCustomVolume(playerIdx: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    const volume = parseFloat(target.value);
    this.playerVolumes.set(playerIdx, volume);

    // Apply the volume immediately if not muted
    if (!this.isPlayerMuted(playerIdx)) {
      const currentClientIdx = this.clientIdx;
      if (currentClientIdx !== undefined) {
        const distance = getDistance(playerIdx);
        let proximityVolume = 1;
        if (distance > MAX_PROXIMITY_DISTANCE) {
          proximityVolume = 0;
        } else if (distance > MIN_AUDIBLE_DISTANCE) {
          proximityVolume = 1 - ((distance - MIN_AUDIBLE_DISTANCE) / (MAX_PROXIMITY_DISTANCE - MIN_AUDIBLE_DISTANCE));
        }
        proximityVolume = Math.max(0, Math.min(1, proximityVolume));
        this.voiceChatService.setPlayerVolume(playerIdx, proximityVolume * volume);
      }
    }
  }

  getPlayerCustomVolume(playerIdx: number): number {
    return this.playerVolumes.get(playerIdx) ?? 1;
  }

  isPlayerMuted(playerIdx: number): boolean {
    return this.playerMutedStatus.get(playerIdx) ?? false;
  }

  get micAccessDenied(): boolean {
    return this.micAccessStatus === 'denied';
  }

  get micAccessError(): boolean {
    return this.micAccessStatus === 'error';
  }
  

}