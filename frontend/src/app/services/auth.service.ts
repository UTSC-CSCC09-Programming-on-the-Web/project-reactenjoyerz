import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environments';
import { setToken } from "../../../../gamelogic/netcode/client";

interface User {
  id: number;
  email: string;
  hasSubscription: boolean;
  token: string;
}

let _user: User | null = null

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  endpoint = environment.apiUrl;

  constructor(private http: HttpClient) {}
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
          setToken(user.token);
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
          setToken(user.token);
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
    _user = null;
    return this.http.get(`${this.endpoint}/users/logout`, {
      withCredentials: true,
    });
  }

  isLoggedIn(): boolean {
    return _user !== null;
  }

  getToken(): string {
    return _user?.token ?? "";
  }

  hasSubscription(): boolean {
    return _user?.hasSubscription ?? false;
  }

  getUserId(): number | null {
    return _user?.id ?? null;
  }

  getEmail(): string | null {
    return _user?.email ?? null;
  }
}
