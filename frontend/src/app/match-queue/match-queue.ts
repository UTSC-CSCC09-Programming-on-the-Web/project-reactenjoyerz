import { join, createRoom, getClientInfo, getClientIdx } from "../../../../gamelogic/netcode/client";
import { inject, Component, HostListener, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { leave } from "../../../../gamelogic/netcode/client";
import { ErrorCode } from "../../../../gamelogic/netcode/common";
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from "@angular/forms";

@Component({
  selector: 'app-match-queue',
  imports: [ReactiveFormsModule],
  templateUrl: './match-queue.html',
  styleUrl: './match-queue.css',
  providers: [],
})
export class MatchQueue {
  message = '';
  private authService = inject(AuthService);
  private router = inject(Router);
  waiting = signal<boolean>(false);

  gameCode = signal<string>('');
  playerCount = signal<number>(1);
  playerLimit = signal<number>(4);


  joinForm: FormGroup;
  createForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.joinForm = this.fb.group({
      gameId: ['', []],
      password: ['', []],
    });

    this.createForm = this.fb.group({
      playerLimit: ['', []],
      password: ['', []],
    });
  }

  private errorHandler = (err: number) => {
    let msg: string = '';
    let fatal = true; //change

    switch (err) {
      case ErrorCode.Success:
        msg = 'what';
        break;
      case ErrorCode.InvalidToken:
        msg = 'Invalid token';
        break;
      case ErrorCode.GameStarted:
        msg = 'Game already started';
        break;
      case ErrorCode.InvalidRoom:
        msg = 'Entering non-existant room';
        break;
      case ErrorCode.RoomExists:
        msg = 'Creating a room that already exists';
        break;
      case ErrorCode.SimJoin:
        msg = 'Joining 2 rooms at the same time';
        break;
      case ErrorCode.WrongPassword:
        msg = 'Wrong room password';
        break;
      case ErrorCode.NotInGame:
        msg = 'Action made despite not being in game';
        break;
      case ErrorCode.GameNotStarted:
        msg = 'Game not started';
        break;
      default:
        console.error(`Error: unknown error code ${err}`);
    }

    this.router.navigate(['/home']);
    console.error(msg);
    return fatal;
  };

  joinGame() {
    let { gameId, password } = this.joinForm.value;
    console.log(this.joinForm.value);

    if (Number.isNaN(gameId)) gameId = undefined;
    else gameId = Number.parseInt(gameId);

    join(
      () => {
        this.gameCode.set(getClientInfo().gameId.toString());
        this.waiting.set(true);
      },
      () => {
        this.router.navigate(['/game']);
      },
      this.errorHandler,
      () => {
        this.waiting.set(false);
        this.router.navigate(['/leaderboard']);
      },
      { gameId, password }
    );
  }

  createGame() {
    let { playerLimit, password } = this.createForm.value;

    if (Number.isNaN(playerLimit)) return;

    playerLimit = Number.parseInt(playerLimit);

    // note: probably should change name
    createRoom(
      () => {
        this.gameCode.set(getClientInfo().gameId.toString());
        this.playerLimit.set(playerLimit);
        this.waiting.set(true);
      },
      () => {
        this.router.navigate(['/game']);
      },
      this.errorHandler,
      () => {
        this.waiting.set(false);
        this.router.navigate(['/leaderboard']);
      },
      { playerLimit, password }
    );
  }

  leaveRoom() {
    leave();
    this.waiting.set(false);
  }

  refreshStatus() {
    // Placeholder for logic to refresh room status
    console.log('Refreshing status...');
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
