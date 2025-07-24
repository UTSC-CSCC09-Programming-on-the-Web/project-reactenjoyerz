import { inject, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './register.html',
})
export class Register {
  username = '';
  email = '';
  password = '';
  message = '';
  private authService = inject(AuthService);

  constructor(private router: Router) {}

  home() {
    this.router.navigate(['/home']);
  }

  register() {
    this.authService.register(this.username, this.email, this.password).subscribe({
      next: (res) => {
        console.log('Registration successful:', res);
        this.message = 'Success!';
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.message = err.error?.error || 'Registration failed';
      }
    });
  }
}
