import { inject, Component, OnInit } from '@angular/core';
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
  private authService = inject(AuthService);

  constructor(private router: Router, private speechService: SpeechService) {}
  home() {
    this.router.navigate(['/home']);
  }

  ngOnInit() {
    if (this.authService.isLoggedIn()) this.router.navigate(['/game']);
  }
}
