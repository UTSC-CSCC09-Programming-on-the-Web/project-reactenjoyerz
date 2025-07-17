import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SpeechService } from '../services/speech';
import { Subscription } from 'rxjs';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-home',
  imports: [RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  isRecording = false;

  constructor(private authService: AuthService, private router: Router, private speechService: SpeechService) {}
  home() {
    this.router.navigate(['/home']);
  }


  ngOnInit() {
    this.authService.me().subscribe({
      next: (res) => {
        if (res?.id) {
          this.router.navigate(['/game']);
        }
      }
    });
  }
}
