import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { hasStarted } from '../../../../gamelogic/netcode/client';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class GameGuard implements CanActivate {
  constructor(private router: Router, private auth: AuthService) {}

  // only activate iff game has started
  canActivate(): boolean {
    const isAuth = this.auth.isLoggedIn();
    const started = hasStarted();
    if (isAuth) {
      if (started)
        return true;
      else
        this.router.navigate(["/game-select"]);
    } else
      this.router.navigate(["/home"]);

    return false;
  }
}