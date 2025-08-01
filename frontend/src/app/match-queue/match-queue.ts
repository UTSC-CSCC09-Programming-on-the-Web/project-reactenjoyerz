import { join, createRoom, getClientInfo, getClientIdx } from "../../../../gamelogic/netcode/client";
import { inject, Component, HostListener, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { leave } from "../../../../gamelogic/netcode/client";
import { ErrorCode } from "../../../../gamelogic/netcode/common";
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from "@angular/forms";
import { filter } from "rxjs";
import { RoomService } from "../services/room-service";

@Component({
  selector: 'app-match-queue',
  imports: [ReactiveFormsModule],
  templateUrl: './match-queue.html',
  styleUrl: './match-queue.css',
  providers: [],
})
export class MatchQueue {
  private authService = inject(AuthService);
  private router = inject(Router);

  isPrivate = false;
  gameCode = signal<string>('');
  message = signal('');

  joinForm: FormGroup;
  createForm: FormGroup;

  constructor(private fb: FormBuilder, private rs: RoomService) {
    this.joinForm = this.fb.group({
      gameId: ['', []],
      password: ['', []],
    });

    this.createForm = this.fb.group({
      playerLimit: ['', []],
      password: ['', []],
    });

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.gameCode.set(getClientInfo()?.gameId.toString() ?? '');
        this.isPrivate = this.rs.gameIsPrivate();
        this.rs.attachListener("match", (err) => this.message.set(err));
      });
  }

  leaveRoom() {
    leave();
    this.router.navigate(['/game-select']);
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
  }

  @HostListener('window:beforeunload')
  onUnload() {
    leave();
  }
}
