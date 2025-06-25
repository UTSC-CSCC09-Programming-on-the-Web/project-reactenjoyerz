import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router'

@Component({
  selector: 'app-subscribe',
  standalone: true,
  templateUrl: './subscribe.html',
})
export class Subscribe implements OnInit {
  message = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.http
      .get<any>('http://localhost:8000/api/users/me', { withCredentials: true })
      .subscribe({
        next: (res) => {
          if (res.hasSubscription) {
            this.router.navigate(['/game']);
          }
        },
        error: () => {
          // Optionally handle error, e.g. not logged in
        },
      });
  }

  subscribe() {
    this.http
      .post<{ url: string }>(
        'http://localhost:8000/api/payments/create-subscription',
        {},
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
          console.error(err);
        },
      });
  }
}