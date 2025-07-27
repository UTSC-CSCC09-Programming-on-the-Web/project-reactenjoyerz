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
  listener?: (transcript: string) => void;
  transcript = '';

  // Inject the new MicrophoneService
  constructor(private micService: MicrophoneService) {
    const SpeechRecognition = webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = false;
  }

  async startRecording(listener: (transcript: string) => void) {
    if (this.listener) return;

    try {
      await this.micService.getStream('speech');

      this.listener = listener;

      this.recognition.onstart = () => {
        console.log('speech recognition start');
      };

      // https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionResult
      this.recognition.onresult = (event: any) => {
        this.transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          this.transcript += event.results[i][0].transcript;
        }
      };

      this.recognition.onend = () => {
        if (this.listener) this.listener(this.transcript);

        console.log('speech recognition end');
        this.listener = undefined;
        console.log(this.transcript);
      };

      this.recognition.start();
    } catch (error) {
      console.error('SpeechService could not acquire microphone:', error);
    }
  }

  stopRecording() {
    if (!this.listener) return;
    this.recognition.stop();
    this.micService.releaseStream('speech');
  }
}