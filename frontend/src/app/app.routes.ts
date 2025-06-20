import { Routes } from '@angular/router';
import { GameBoard } from './game-board/game-board';
import { Home } from './home/home'
export const routes: Routes = [
    { path: 'game', component: GameBoard },
    { path: 'home', component: Home },
    { path: '**', redirectTo:'home' }
];
