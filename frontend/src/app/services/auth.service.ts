import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

interface User {
  id: number;
  email: string;
  hasSubscription: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  apiUrl = 'http://localhost:8000/api/users';
  //endpoint = environment.apiEndpoint;
  private _user: User | null = null;

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
      .post<User>(`${this.apiUrl}/login`, { email, password }, { withCredentials: true })
      .pipe(
        tap((user) => {
          this._user = user;
        })
      );
  }

  googleLogin(idToken: string): Observable<any> {
  return this.http
    .post<User>(`${this.apiUrl}/google-login`, { idToken }, { withCredentials: true })
    .pipe(
      tap((user) => {
        this._user = user;
      })
    );
  }

  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { username, email, password }, { withCredentials: true });
  }

  logout(): Observable<any> {
    this._user = null;
    return this.http.get(`${this.apiUrl}/logout`, { withCredentials: true });
  }

  me(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`, { withCredentials: true }).pipe(
      tap((user) => {
        this._user = user;
      })
    );
  }

  isLoggedIn(): boolean {
    return this._user !== null;
  }

  hasSubscription(): boolean {
    return this._user?.hasSubscription ?? false;
  }

  getUserId(): number | null {
    return this._user?.id ?? null;
  }

  getEmail(): string | null {
    return this._user?.email ?? null;
  }
}
