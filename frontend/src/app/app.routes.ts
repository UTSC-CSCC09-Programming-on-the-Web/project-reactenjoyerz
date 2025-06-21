import { Routes } from '@angular/router';
import { GameBoard } from './game-board/game-board';
import { Home } from './home/home'
import { MatchQueue } from './match-queue/match-queue';
import { Login } from './login/login'
import { Register } from './register/register'

export const routes: Routes = [
    { path: ':id/game', component: GameBoard },
    { path: 'game', component: MatchQueue},
    { path: 'home', component: Home },
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    { path: '**', redirectTo:'home' }
];
