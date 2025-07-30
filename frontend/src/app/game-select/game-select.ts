import { Component, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { RoomService } from '../services/room-service';
import { AuthService } from '../services/auth.service';
import { leave } from '../../../../gamelogic/netcode/client';
import { filter } from 'rxjs';

@Component({
  selector: 'app-game-select',
  imports: [],
  templateUrl: './game-select.html',
  styleUrl: './game-select.css'
})
export class GameSelect {
  message = signal('');
  constructor(private router: Router, private rs: RoomService, private authService: AuthService) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.message.set('');
        this.rs.attachListener("game-select", (err) => this.message.set(err));
      });
  }

  navJoinPub() {
    this.rs.joinPublicGame();
  }

  navJoin() {
    this.router.navigate(["/join"]);
  }

  navCreate() {
    this.router.navigate(["/create"]);
  }

  navInstruct() {
    this.router.navigate(["/how-to-play"]);
  }

  logout() {
    leave();
    this.authService.logout().subscribe({
      next: () => this.router.navigate(["/"]),
    });
  }
}
