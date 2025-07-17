import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  providers: [AuthService]
})
export class Login {
  
  email = '';
  password = '';
  message = '';

  constructor(private authService: AuthService, private router: Router) {}

  home() {
    this.router.navigate(['/home']);
  }
  googleLogin() {
    this.router.navigate(['/google-login']);
  }
  login() {
    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        if (res.has_subscription) {
          this.router.navigate(['/match']);
        } else {
          this.router.navigate(['/subscribe']);
        }
      },
      error: (err) => {
        if (err.status === 402) {
          this.message = err.error?.error || 'Subscription required. Redirecting to subscribe...';
          setTimeout(() => this.router.navigate(['/subscribe']), 1500);
        } else {
          this.message = err.error?.error || 'Login failed';
        }
      }
    });
  }
  
}
