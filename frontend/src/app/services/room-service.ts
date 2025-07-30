import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ErrorCode } from '../../../../gamelogic/netcode/common';
import { AuthService } from './auth.service';
import { createRoom, join } from '../../../../gamelogic/netcode/client';

type errorListener = (err: string) => void;

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private onErrorListeners: errorListener[] = [];

  constructor(private router: Router, private authService: AuthService) { }

  attachListener(listener: errorListener) {
    this.onErrorListeners.push(listener);
  }

  private notifyListeners(err: string) {
    this.onErrorListeners.forEach((listener) => listener(err));
  }

  private errorHandler = (err: number) => {
    let message = '';
    let fatal = false; //change

    switch (err) {
      case ErrorCode.Success:
        message = 'Succesfully joined match';
        break;
      case ErrorCode.InvalidToken:
        message = 'Invalid token';
        fatal = true;
        break;
      case ErrorCode.GameStarted:
        message = 'Game already started';
        break;
      case ErrorCode.InvalidRoom:
        message = 'Entering non-existant room';
        break;
      case ErrorCode.RoomExists:
        message = 'Creating a room that already exists';
        break;
      case ErrorCode.SimJoin:
        message = 'Joining 2 rooms at the same time';
        break;
      case ErrorCode.WrongPassword:
        message = 'Wrong room password';
        break;
      case ErrorCode.NotInGame:
        message = 'Action made despite not being in game';
        break;
      case ErrorCode.GameNotStarted:
        message = 'Game not started';
        break;
      case ErrorCode.InvalidArgs:
        message = 'Invalid Arguments';
        break;
      default:
        console.error(`Error: unknown error code ${err}`);
    }

    this.notifyListeners(message);

    if (fatal) {
      setTimeout(() => {
        this.authService.logout().subscribe({
          next: () => {
            this.router.navigate(['/home']);
          },
        });
      }, 5000);

    } else {
      setTimeout(() => {
        message = '';
      }, 20000);
    }
    return fatal;
  };

  private onJoin = () => {
    this.router.navigate(["/game"]);
  }

  private onWait = () => {
    this.router.navigate(["/match"]);
  }

  private onEnd = () => {
    this.router.navigate(['/leaderboard']);
  }

  createGame(playerLimit: string, password: string) {
    let _playerLimit: number;
    if (Number.isNaN(playerLimit)) {
      this.notifyListeners("Invalid player limit");
      return;
    } else {
      _playerLimit = Number.parseInt(playerLimit);
    }

    createRoom(
      this.onWait,
      this.onJoin,
      this.errorHandler,
      this.onEnd,
      { playerLimit: _playerLimit, password }
    );
  }

  joinPrivateGame(gameId: string, password: string) {
    let _gameId: number;
    if (Number.isNaN(gameId)) {
      this.notifyListeners("Invalid player limit");
      return;
    } else {
      _gameId = Number.parseInt(gameId);
    }
    join(
      this.onWait,
      this.onJoin,
      this.errorHandler,
      this.onEnd,
      { gameId: _gameId, password }
    )
  }

  joinPublicGame() {
    join(
      this.onWait,
      this.onJoin,
      this.errorHandler,
      this.onEnd,
      { gameId: undefined, password: undefined }
    );
  }
}
