import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { isWaiting } from '../../../../gamelogic/netcode/client';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class WaitingGuard implements CanActivate {
  constructor(private router: Router, private auth: AuthService) {}

  // only activate iff game has started
  canActivate(): boolean {
    const isAuth = this.auth.isLoggedIn();
    const waiting = isWaiting();
    if (isAuth) {
      if (waiting)
        return true;
      else
        this.router.navigate(["/game-select"]);
    } else
      this.router.navigate(["/home"]);

    return false;
  }
}