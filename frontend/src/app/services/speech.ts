import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';

// youtube tutorial: https://www.youtube.com/watch?v=dCaZhWIhLWI
declare var webkitSpeechRecognition: any;

@Injectable({
  providedIn: 'root',
})
export class SpeechService {
  recognition: any;
  isRecording = false; // boolean for later to toggle if its recording voice


  //https://v17.angular.io/guide/rx-library
  private transcriptSubject = new Subject<string>();
  transcript$ = this.transcriptSubject.asObservable();

  constructor(private zone: NgZone) {
    const SpeechRecognition = webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = true;
  }

  startListening() {
    if (this.isRecording ) {
      return;
    };
    this.isRecording = true; 

    // https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionResult
    this.recognition.onresult = (event: any) => {
      this.zone.run(() => {
        this.transcriptSubject.next(event.results[event.resultIndex][0].transcript);
      });
    };

    //restarts to keep recording
    this.recognition.onend = () => {
      if (this.isRecording) {
        this.recognition.start()
      }
    };

    this.recognition.start();
  }

  //toggle voice controls off
  stopListening() {
    if (this.isRecording) {
      this.recognition.stop();
      this.isRecording = false
    }
  }

}
