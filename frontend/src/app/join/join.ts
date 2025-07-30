import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from "@angular/forms";
import { RoomService } from '../services/room-service';
import { filter } from 'rxjs/operators';
import { leave } from '../../../../gamelogic/netcode/client';
import { signal } from '@angular/core';

@Component({
  selector: 'app-join',
  imports: [ReactiveFormsModule],
  templateUrl: './join.html',
  styleUrl: './join.css'
})
export class Join {
  message = signal('');
  joinForm: FormGroup;

  constructor(private router: Router, private fb: FormBuilder, private rs: RoomService) {
    this.joinForm = this.fb.group({
      gameId: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      password: ['', [Validators.required]],
    });

    this.rs.attachListener((err) => this.message.set(err))

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.message.set('');
      });
  }

  joinPrivateGame() {
    if (!this.joinForm.valid) {
      this.message.set(
        this.joinForm.value.password === '' 
          ? 'Missing password'
          : 'Invalid or missing game id'
      );

      return;
    }

    let { playerLimit, password } = this.joinForm.value;
    this.rs.joinPrivateGame(playerLimit, password);
  }

  joinPublicGame() {
    this.rs.joinPublicGame();
  }

  goBack() {
    //this.router.navigate(['/main'])
  }
}
