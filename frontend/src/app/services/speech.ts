import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';
import { MicrophoneService } from './microphone.service'; // Import new service

declare var webkitSpeechRecognition: any;

@Injectable({
  providedIn: 'root',
})
export class SpeechService {
  recognition: any;
  isListening = false;
  private transcriptSubject = new Subject<{ transcript: string, index: number }>();
  transcript$ = this.transcriptSubject.asObservable();

  // Inject the new MicrophoneService
  constructor(private zone: NgZone, private micService: MicrophoneService) {
    const SpeechRecognition = webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = true;
  }

  async startListening() {
    if (this.isListening) return;

    try {
      // Request the stream from the central service
      await this.micService.getStream('speech');
      this.isListening = true;

      this.recognition.onresult = (event: any) => {
        this.zone.run(() => {
          this.transcriptSubject.next({ transcript: event.results[event.resultIndex][0].transcript, index: event.resultIndex});
        });
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          this.recognition.start();
        }
      };

      this.recognition.start();
      console.log("Speech recognition started.");
    } catch (error) {
      console.error("SpeechService could not acquire microphone:", error);
    }
  }

  stopListening() {
    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      // Release the stream so other services can use it
      this.micService.releaseStream('speech');
      console.log("Speech recognition stopped.");
    }
  }
}