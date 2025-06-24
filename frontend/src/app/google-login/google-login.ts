import { Component } from '@angular/core';
import { GoogleApiService } from '../services/google-api';
import { AuthService } from '../services/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-google-login',
  templateUrl: './google-login.html',
  styleUrl: './google-login.css'
})
export class GoogleLogin {
  message = '';

  constructor(private readonly google: GoogleApiService, private readonly auth: AuthService, private readonly router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.handleGoogleLogin();
      });
  }

  handleGoogleLogin() {
    const idToken = this.google.getIdToken();
    if (idToken) {
      this.auth.googleLogin(idToken).subscribe({
        next: (res) => {
          if (res.hasSubscription) {
            this.router.navigate(['/game']);
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
