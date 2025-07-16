import { Injectable, NgZone } from '@angular/core';
import { WebSocketService } from './web-socket.service';
import { Subject, BehaviorSubject } from 'rxjs';
import { MicrophoneService } from './microphone.service';


interface ClientInfo {
  gameId: number;
  clientIdx: number;
}

@Injectable({
  providedIn: 'root'
})
export class VoiceChatService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext;
  private gainNodes: Map<number, GainNode> = new Map();
  private playerVolumes: Map<number, number> = new Map();
  private audioChunkBuffers: Map<number, ArrayBuffer[]> = new Map();

  public isTransmitting = new BehaviorSubject<boolean>(false);
  public isReceivingAudio = new Subject<{ clientIdx: number, isTalking: boolean }>();
  public micAccessStatus = new BehaviorSubject<'idle' | 'granted' | 'denied' | 'error'>('idle');

  private _gameId: number | null = null;
  private _clientIdx: number | null = null;

  constructor(private ngZone: NgZone, private wss: WebSocketService, private micService: MicrophoneService) {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // HANDLER 1: When a player starts talking, create a buffer for them.
    this.wss.bindHandler('voice.playerStartedTalking', (payload: { senderClientIdx: number }) => {
      this.ngZone.run(() => {
        console.log(`Player ${payload.senderClientIdx} started talking. Initializing chunk buffer.`);
        this.audioChunkBuffers.set(payload.senderClientIdx, []);
        this.isReceivingAudio.next({ clientIdx: payload.senderClientIdx, isTalking: true });
      });
    });

    // HANDLER 2: When an audio chunk arrives, add it to that player's buffer.
    this.wss.bindHandler('voice.playerAudio', (payload: { senderClientIdx: number, chunk: ArrayBuffer }) => {
      this.ngZone.run(() => {
        const buffer = this.audioChunkBuffers.get(payload.senderClientIdx);
        if (buffer) {
          buffer.push(payload.chunk);
        }
      });
    });

    // HANDLER 3: When a player stops talking, assemble and play the audio.
    this.wss.bindHandler('voice.playerStoppedTalking', (payload: { senderClientIdx: number }) => {
      this.ngZone.run(() => {
        this.isReceivingAudio.next({ clientIdx: payload.senderClientIdx, isTalking: false });
        const chunks = this.audioChunkBuffers.get(payload.senderClientIdx);

        if (chunks && chunks.length > 0) {
          console.log(`Assembling ${chunks.length} chunks from player ${payload.senderClientIdx}.`);

          const audioBlob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
          this.playAssembledAudio(payload.senderClientIdx, audioBlob);
          this.audioChunkBuffers.delete(payload.senderClientIdx);
        }
      });
    });
  }

  private async playAssembledAudio(senderClientIdx: number, audioBlob: Blob) {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;

      // Basic playback with volume control
      let gainNode = this.gainNodes.get(senderClientIdx);
      if (!gainNode) {
        gainNode = this.audioContext.createGain();
        this.gainNodes.set(senderClientIdx, gainNode);
      }
      gainNode.gain.value = this.playerVolumes.get(senderClientIdx) ?? 1;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      source.start(0);

      console.log(`SUCCESS: Playing assembled audio from sender ${senderClientIdx}.`);
    } catch (error) {
      console.error(`Error decoding or playing ASSEMBLED audio for sender ${senderClientIdx}:`, error);
    }
  }

  public setClient(info: ClientInfo): void {
    if (info) {
      this._gameId = info.gameId;
      this._clientIdx = info.clientIdx;
      console.log(`VoiceChatService: Client info set - Game ID: ${this._gameId}, Client Index: ${this._clientIdx}`);
    }
  }

//   private async getMicrophone(): Promise<MediaStream> {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       this.micAccessStatus.next('granted');
//       return stream;
//     } catch (err: any) {
//       console.error('Error accessing microphone:', err);
//       if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
//         this.micAccessStatus.next('denied');
//       } else {
//         this.micAccessStatus.next('error');
//       }
//       throw err;
//     }
//   }

  async startTransmitting() {
    if (this.isTransmitting.getValue()) return;
    if (this._gameId === null || this._clientIdx === null) {
      console.warn('VoiceChatService: Client info not set.');
      return;
    }

    try {
      // Request the stream from the central service
      const stream = await this.micService.getStream('voicechat');
      
      this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          event.data.arrayBuffer().then(buffer => {
            this.sendAudioChunk(buffer);
          });
        }
      };

      this.mediaRecorder.onstop = () => {
        // Release the stream when done
        this.micService.releaseStream('voicechat');
        this.isTransmitting.next(false);
      };

      this.mediaRecorder.start(50);
      this.isTransmitting.next(true);
      this.wss.emit('voice.start', { gameId: this._gameId, clientIdx: this._clientIdx });
    } catch (error) {
      console.error('VoiceChatService could not acquire microphone:', error);
    }
  }


  stopTransmitting() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      // No need to release the stream here, onstop will handle it.
      if (this._gameId !== null && this._clientIdx !== null) {
        this.wss.emit('voice.stop', { gameId: this._gameId, clientIdx: this._clientIdx });
      }
    }
  }
  
  private sendAudioChunk(chunk: ArrayBuffer) {
    if (this.isTransmitting.getValue()) {
        this.wss.emit('voice.audioChunk', {
            gameId: this._gameId,
            clientIdx: this._clientIdx,
            chunk: chunk,
        });
    }
  }

  setPlayerVolume(clientIdx: number, volume: number) {
    this.playerVolumes.set(clientIdx, volume);
    const gainNode = this.gainNodes.get(clientIdx);
    if (gainNode) {
      gainNode.gain.value = volume;
    }
  }

  public resumeAudioContext(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().then(() => {
        console.log('AudioContext resumed successfully.');
      });
    }
  }
}