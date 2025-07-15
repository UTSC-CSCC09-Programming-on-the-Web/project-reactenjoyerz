import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SpeechService } from '../services/speech';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  imports: [RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  
  speechText = '';
  transcriptSub?: Subscription;
  leftCount = 0;
  rightCount = 0;
  upCount = 0;
  downCount = 0;
  lastIndex = -1;
  lastTranscript = '';
  resetTimeout?: any;
  isListening = false;

  constructor(private authService: AuthService, private router: Router, private speechService: SpeechService) {}
  login() {
    
  }
  register() {

  }
  ngOnInit() {
    this.authService.me().subscribe({
      next: (res) => {
        if (res?.id) {
          this.router.navigate(['/game']);
        }
      }
    });

    /* ------------ START VOICE CONTROL BLOCK ------------- */
    this.speechService.startListening();

    this.transcriptSub = this.speechService.transcript$.subscribe(({ transcript, index }) => {
      
      if (transcript.length < this.lastTranscript.length || this.lastTranscript === transcript && this.lastIndex === index ) {
        return;
      } 
      console.log(transcript)
      console.log(index)
      this.speechText = transcript;

      if (this.lastIndex === index) {
        const newTranscript = transcript.replace(this.lastTranscript, '');

        if (newTranscript.toLowerCase().includes('left')) {
          this.leftCount++;
        }
        if (newTranscript.toLowerCase().includes('right')) {
          this.rightCount++;
        }
        if (newTranscript.toLowerCase().includes('up')) {
          this.upCount++;
        }
        if (newTranscript.toLowerCase().includes('down')) {
          this.downCount++;
        }
      } 
      else {
        if (transcript.toLowerCase().includes('left')) {
          this.leftCount++;
        }

        if (transcript.toLowerCase().includes('right')) {
          this.rightCount++;
        }

        if (transcript.toLowerCase().includes('up')) {
          this.upCount++;
        }

        if (transcript.toLowerCase().includes('down')) {
          this.downCount++;
        }

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
