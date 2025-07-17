import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  UrlTree
} from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private http: HttpClient, private router: Router) {}
  endpoint = environment.apiUrl;
  canActivate(): Observable<boolean | UrlTree> {
    return this.http.get<any>(`${this.endpoint}/users/me`, { withCredentials: true }).pipe(
      map((res) => {
        if (res.has_subscription) {
          return true;
        } else {
          return this.router.parseUrl('/subscribe');
        }
      }),
      catchError(() => {
        return of(this.router.parseUrl('/login'));
      })
    );
  }
}