import { join, createRoom } from "../../../../gamelogic/netcode/client";
import { inject, Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { leave } from "../../../../gamelogic/netcode/client";
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from "@angular/forms";


@Component({
  selector: 'app-match-queue',
  imports: [ReactiveFormsModule],
  templateUrl: './match-queue.html',
  styleUrl: './match-queue.css',
  providers: []
})
export class MatchQueue {
  dots = "";
  message = '';
  private authService = inject(AuthService);

  joinForm: FormGroup;
  createForm: FormGroup;

  constructor (private fb: FormBuilder, private router: Router) {
    this.joinForm = this.fb.group({
      room: ['', [Validators.pattern('^\d?$')]],
      password: ['', [Validators.required]]
    })

    this.createForm = this.fb.group({
      playerLimit: ['', [Validators.required, Validators.pattern('^\d+$')]],
      password: ['', [Validators.required]]
    })
  }

  joinGame() {
    if (!this.joinForm.valid) return;
    let { roomId, password } = this.joinForm.value;

    if (Number.isNaN(roomId))
      roomId = undefined
    else
      roomId = Number.parseInt(roomId);

    join(
      () => {
        this.router.navigate(['/game']);
      },
      () => {
        this.router.navigate(['/home']);
      },
      (scores: { name: string, score: number}[]) => {
        console.log("Game Ended!");
        console.log(scores);
        this.router.navigate(["/match"]);
      },
      { roomId, password }
    );
  }

  createGame() {
    if (!this.createForm.valid) return;
    let { playerLimit, password } = this.createForm.value;

    if (Number.isNaN(playerLimit))
      return;

    playerLimit = Number.parseInt(playerLimit);

    // note: probably should change name
    createRoom(
      () => {
        this.router.navigate(['/game']);
      },
      () => {
        this.router.navigate(['/home']);
      },
      (scores: { name: string, score: number}[]) => {
        console.log("Game Ended!");
        console.log(scores);
        this.router.navigate(["/match"]);
      },
      { playerLimit, password }
    );
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        leave();
        this.router.navigate(['/home']);
      },
      error: () => {
        leave();
        this.router.navigate(['/home']);
      }
    });
  }
  
  @HostListener("window:beforeunload")
  onUnload() {
    leave()
  }
}
