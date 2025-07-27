import { inject, Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router'
import { environment } from '../../environments/environments';
import { AuthService } from '../services/auth.service';
import { WebSocketService } from '../services/web-socket.service';

@Component({
  selector: 'app-subscribe',
  standalone: true,
  templateUrl: './subscribe.html',
})
export class Subscribe implements OnInit {
  message = '';
  private authService = inject(AuthService);

  constructor(private wss: WebSocketService, private http: HttpClient, private router: Router) {}

  ngOnInit() {
    if (this.authService.hasSubscription())
      this.router.navigate(["/match"]);
  }

  subscribe() {
    console.assert(this.authService.isLoggedIn(), "subscribe.ts/subscribe: not logged in");
    this.http
      .post<{ url: string }>(
        `${environment.apiUrl}/payments/create-subscription`,
        { token: this.wss.getToken() },
        { withCredentials: true }
      )
      .subscribe({
        next: (res) => {
          if (res.url) {
            window.location.href = res.url;
          }
        },
        error: (err) => {
          this.message = 'Error creating subscription. Please try again.';
          setTimeout(() => {
            this.router.navigate(["/home"]);
          }, 5000);
          console.error(err);
        },
      });
  }
}