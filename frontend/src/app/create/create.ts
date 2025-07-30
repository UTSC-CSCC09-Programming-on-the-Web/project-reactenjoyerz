import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from "@angular/forms";
import { RoomService } from '../services/room-service';
import { filter } from 'rxjs/operators';
import { leave } from '../../../../gamelogic/netcode/client';
import { signal } from '@angular/core';

@Component({
  selector: 'app-create',
  imports: [ReactiveFormsModule],
  templateUrl: './create.html',
  styleUrl: './create.css'
})
export class Create {
  message = signal('');
  createForm: FormGroup;

  constructor(private router: Router, private fb: FormBuilder, private rs: RoomService) {
    this.createForm = this.fb.group({
      playerLimit: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      password: ['', [Validators.required]],
    });

    this.rs.attachListener((err) => this.message.set(err))

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.message.set('');
      });
  }

  createGame() {
    if (!this.createForm.valid) {
      this.message.set(
        this.createForm.value.password === '' 
          ? 'Missing password'
          : 'Invalid or missing player limit'
      );

      return;
    }

    let { playerLimit, password } = this.createForm.value;
    this.rs.createGame(playerLimit, password);
  }

  goBack() {
    //this.router.navigate(['/main'])
  }
}
