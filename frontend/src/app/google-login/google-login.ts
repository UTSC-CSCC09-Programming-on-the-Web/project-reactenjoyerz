import { Component, OnInit } from '@angular/core';
import { GoogleApiService } from '../services/google-api';
import { AuthService } from '../services/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-google-login',
  templateUrl: './google-login.html',
  styleUrl: './google-login.css'
})
export class GoogleLogin implements OnInit {
  message = '';

  constructor(private readonly google: GoogleApiService, private readonly auth: AuthService, private readonly router: Router) {}

  async ngOnInit() {
    await this.google.login();
    if (!this.google.hasValidAccessToken()) {
      this.google.initLoginFlow();
      return;
    }
    this.handleGoogleLogin();
  }

  handleGoogleLogin() {
    const idToken = this.google.getIdToken();
    if (idToken) {
      this.auth.googleLogin(idToken).subscribe({
        next: (res) => {
          if (res.hasSubscription) {
            this.router.navigate(['/match']);
          } else {
            this.router.navigate(['/subscribe']);
          }
        },
        error: (err) => {
          if (err.status === 402) {
            this.message = err.error?.error || 'Subscription required. Redirecting to subscribe...';
            this.router.navigate(['/subscribe']);
          } else {
            this.message = err.error?.error || 'Login failed';
          }
        }
      });
    }
  }
}