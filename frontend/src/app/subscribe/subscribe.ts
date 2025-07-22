import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router'
import { environment } from '../../environments/environments';

@Component({
  selector: 'app-subscribe',
  standalone: true,
  templateUrl: './subscribe.html',
})
export class Subscribe implements OnInit {
  message = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {

    const url = `${environment.apiUrl}`; 
    this.http
      .get<any>(`${environment.apiUrl}/users/me`, { withCredentials: true })
      .subscribe({
        next: (res) => {
          if (res.hasSubscription) {
            this.router.navigate(['/match']);
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
        `${environment.apiUrl}/payments/create-subscription`,
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