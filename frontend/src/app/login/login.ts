import { inject, Component } from '@angular/core';
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
  private authService = inject(AuthService);

  constructor(private router: Router) {}

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
          this.router.navigate(['/game-select']);
        } else {
          this.message = 'Subscription required. Redirecting to subscription page ...';
          setTimeout(() => this.router.navigate(['/subscribe']), 750);
          this.router.navigate(['/subscribe']);
        }
      },
      error: (err) => {
        this.message = err.error?.error || 'Login failed';
      },
    });
  }
}
