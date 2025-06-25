import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  imports: [RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  constructor(private authService: AuthService, private router: Router) {}
  login() {
    
  }
  register() {

  }
  ngOnInit() {
    this.authService.me().subscribe({
      next: (res) => {
        if (res?.id) {
          this.router.navigate(['/game']);
        }
      }
    });
  }
}
