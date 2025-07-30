import { join, createRoom, getClientInfo, getClientIdx } from "../../../../gamelogic/netcode/client";
import { inject, Component, HostListener, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { leave } from "../../../../gamelogic/netcode/client";
import { ErrorCode } from "../../../../gamelogic/netcode/common";
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from "@angular/forms";
import { filter } from "rxjs";

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

  gameCode = signal<string>('');

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

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.gameCode.set(getClientInfo()?.gameId.toString() ?? '');
      });
  }

  leaveRoom() {
    leave();
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
