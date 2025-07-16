import { moveTo ,shootBullet, fetchFrame, getClientIdx, hasStarted, leave, setDirection, shootBulletVec, stop, getDistance, getClientInfo} from "../../../../gamelogic/netcode/client";
import { Sprite, GameState, Tank, Bullet, getWalls } from "../../../../gamelogic/gamelogic/game-state";
import { signal, Component, HostListener, computed, Host, OnDestroy, OnInit} from "@angular/core";
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

  ngOnInit(): void {
    this.speechService.startListening();
  }

  ngOnDestroy(): void {
    if (this.voiceTransmittingSub) {
      this.voiceTransmittingSub.unsubscribe();
    }
    if (this.voiceReceivingSub) {
      this.voiceReceivingSub.unsubscribe();
    }

    // Stop listening and transmitting when component is destroyed
    this.speechService.stopListening();
    this.voiceChatService.stopTransmitting();
    this.speechService.stopRecording();
    leave(); // Call game leave logic from client.ts
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
    this.speechService.startRecording((transcript: string) => {
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

  toggleListening() {
    if (this.isListening) {
      this.speechService.stopListening();
    } else {
      this.speechService.startListening();
    }
    this.isListening = !this.isListening;
  }

  stopRecording() {
    this.speechService.stopListening();
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