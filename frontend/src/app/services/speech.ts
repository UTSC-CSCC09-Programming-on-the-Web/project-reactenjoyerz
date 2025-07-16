import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';

// youtube tutorial: https://www.youtube.com/watch?v=dCaZhWIhLWI
declare var webkitSpeechRecognition: any;

@Injectable({
  providedIn: 'root',
})
export class SpeechService {
  recognition: any;
  listener?: ((transcript: string) => void);
  transcript = "";

  constructor() {
    const SpeechRecognition = webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = false;
  }

  startListening(listener: (transcript: string) => void) {
    if (this.listener) return;
    this.listener = listener;

    this.recognition.onstart = () => {
      console.log("speech recognition start");
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionResult
    this.recognition.onresult = (event: any) => {
      this.transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        this.transcript += event.results[i][0].transcript;
      }
    };

    this.recognition.onend = () => {
      if (this.listener) 
        this.listener(this.transcript);

      console.log("speech recognition end");
      this.listener = undefined;
    }

    this.recognition.start();
  }

  //toggle voice controls off
  stopListening() {
    if (this.listener)
      this.recognition.stop();
  }
}