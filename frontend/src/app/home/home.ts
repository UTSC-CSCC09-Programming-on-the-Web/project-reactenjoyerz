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
    this.speechService.startListening();

    this.transcriptSub = this.speechService.transcript$.subscribe(text => {
      this.speechText = text;
    });
  }

}
