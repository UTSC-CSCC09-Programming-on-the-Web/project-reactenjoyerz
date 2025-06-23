import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  UrlTree
} from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private http: HttpClient, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.http.get<any>('http://localhost:8000/api/users/me', { withCredentials: true }).pipe(
      map((res) => {
        if (res.hasSubscription) {
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