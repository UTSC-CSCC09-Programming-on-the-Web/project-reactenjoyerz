import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MicrophoneService {
  private mediaStream: MediaStream | null = null;
  private streamOwner: 'speech' | 'voicechat' | null = null;
  
  public micAccessStatus = new BehaviorSubject<'idle' | 'granted' | 'denied' | 'error'>('idle');

  constructor() { }

  private async initializeStream(): Promise<MediaStream> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.micAccessStatus.next('granted');
      return this.mediaStream;
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.micAccessStatus.next('denied');
      } else {
        this.micAccessStatus.next('error');
      }
      throw err;
    }
  }

  async getStream(requester: 'speech' | 'voicechat'): Promise<MediaStream> {
    if (this.streamOwner && this.streamOwner !== requester) {
      throw new Error(`Microphone is already in use by ${this.streamOwner}`);
    }

    if (!this.mediaStream) {
      await this.initializeStream();
    }
    
    this.streamOwner = requester;
    console.log(`Microphone stream acquired by: ${requester}`);
    return this.mediaStream!;
  }

  releaseStream(requester: 'speech' | 'voicechat') {
    if (this.streamOwner === requester) {
      console.log(`Microphone stream released by: ${requester}`);
      this.streamOwner = null;
    }
  }
}