import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environments';
import { leave } from '../../../../gamelogic/netcode/client';
import { WebSocketService } from './web-socket.service';
import { GoogleApiService } from './google-api';

interface User {
  id: number;
  email: string;
  has_subscription: boolean;
  token: string;
  isGoogle: boolean;
}

let _user: User | null = null

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  endpoint = environment.apiUrl;

  constructor(private http: HttpClient, private wss: WebSocketService, private google: GoogleApiService) {}
  /**
   * HttpClient has methods for all the CRUD actions: get, post, put, patch, delete, and head.
   * First parameter is the URL, and the second parameter is the body.
   * You can use this as a reference for how to use HttpClient.
   * @param content The content of the message
   * @returns
   */
  login(email: string, password: string): Observable<any> {
    return this.http
      .post<User>(
        `${this.endpoint}/users/login`,
        { email, password },
        { withCredentials: true }
      )
      .pipe(
        tap((user) => {
          _user = user;
          this.wss.setToken(user.token);
        })
      );
  }

  googleLogin(idToken: string): Observable<any> {
    return this.http
      .post<User>(
        `${this.endpoint}/users/google-login`,
        { idToken },
        { withCredentials: true }
      )
      .pipe(
        tap((user) => {
          _user = user;
          this.wss.setToken(user.token);
        })
      );
  }

  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(
      `${this.endpoint}/users/register`,
      { username, email, password },
      { withCredentials: true }
    );
  }

  logout(): Observable<any> {
    if (_user === null) return new Observable((obs) => obs.error("Already subscribed."));

    const token = this.wss.getToken();
    const isGoogle = _user.isGoogle;
  
    _user = null;
    this.wss.setToken("");

    leave();
    if (isGoogle) {
      this.google.logout();
      return new Observable();
    }

    return this.http.post(`${this.endpoint}/users/logout`, 
      { token },
      { withCredentials: true });
  }

  isLoggedIn(): boolean {
    return _user !== null;
  }

  isGoogleUser(): boolean {
    return _user?.isGoogle ?? false;
  }
  
  getToken(): string {
    return _user?.token ?? "";
  }

  hasSubscription(): boolean {
    return _user?.has_subscription ?? false;
  }

  getUserId(): number | null {
    return _user?.id ?? null;
  }

  getEmail(): string | null {
    return _user?.email ?? null;
  }
}
