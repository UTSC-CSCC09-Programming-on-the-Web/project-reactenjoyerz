import { Routes } from '@angular/router';
import { GameBoard } from './game-board/game-board';
import { Home } from './home/home'
import { MatchQueue } from './match-queue/match-queue';
import { Login } from './login/login'
import { Register } from './register/register'
import { Subscribe } from './subscribe/subscribe';
import { AuthGuard } from './services/auth.guard';
import { GoogleLogin } from './google-login/google-login';

export const routes: Routes = [
    { path: ':id/game', component: GameBoard, canActivate: [AuthGuard] },
    { path: 'game', component: MatchQueue, canActivate: [AuthGuard] },
    { path: 'home', component: Home },
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    { path: 'google-login', component: GoogleLogin },
    { path: 'subscribe', component: Subscribe },
    { path: '**', redirectTo:'home' }
];
