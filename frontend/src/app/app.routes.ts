import { Routes } from '@angular/router';
import { GameBoard } from './game-board/game-board';
import { Home } from './home/home'
import { Login } from './login/login'
import { Register } from './register/register'
export const routes: Routes = [
    { path: 'game', component: GameBoard },
    { path: 'home', component: Home },
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    { path: '**', redirectTo:'home' }
];
