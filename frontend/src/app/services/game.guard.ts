import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { hasStarted } from '../../../../gamelogic/netcode/client';

@Injectable({
  providedIn: 'root',
})
export class GameGuard implements CanActivate {
  constructor(private router: Router) {}

  // only activate iff game has started
  canActivate(): boolean {
    if(hasStarted()) return true;
    else this.router.navigate(["/home"]);
    return false;
  }
}