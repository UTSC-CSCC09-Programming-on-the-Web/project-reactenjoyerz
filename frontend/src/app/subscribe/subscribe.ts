import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-subscribe',
  standalone: true,
  templateUrl: './subscribe.html',
})
export class Subscribe {
  message = '';

  constructor(private http: HttpClient) {}

  subscribe() {
    this.http
      .post<{ url: string }>(
        'http://localhost:8000/api/payments/create-subscription',
        {},
        { withCredentials: true }
      )
      .subscribe({
        next: (res: any) => {
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