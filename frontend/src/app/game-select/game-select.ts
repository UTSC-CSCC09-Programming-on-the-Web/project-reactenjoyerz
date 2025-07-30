import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RoomService } from '../services/room-service';
import { AuthService } from '../services/auth.service';
import { leave } from '../../../../gamelogic/netcode/client';

@Component({
  selector: 'app-game-select',
  imports: [],
  templateUrl: './game-select.html',
  styleUrl: './game-select.css'
})
export class GameSelect {
  constructor(private router: Router, private rs: RoomService, private authService: AuthService) {}

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
      next: () => {
        this.router.navigate(['/home']);
      },
      error: () => {
        this.router.navigate(['/home']);
      },
    });

    this.router.navigate(["/"])
  }
}
