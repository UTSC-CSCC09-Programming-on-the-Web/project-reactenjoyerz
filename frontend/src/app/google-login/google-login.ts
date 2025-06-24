import { Component } from '@angular/core';
import { GoogleApiService } from '../services/google-api';

@Component({
  selector: 'app-google-login',
  imports: [],
  templateUrl: './google-login.html',
  styleUrl: './google-login.css'
})
export class GoogleLogin {
  constructor(private readonly google: GoogleApiService) {}
}
