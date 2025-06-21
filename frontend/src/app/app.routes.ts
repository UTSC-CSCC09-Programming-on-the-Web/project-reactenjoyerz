import { Routes } from '@angular/router';
import { GameBoard } from './game-board/game-board';
import { Home } from './home/home'
import { MatchQueue } from './match-queue/match-queue';

export const routes: Routes = [
    { path: ':id/game', component: GameBoard },
    { path: 'game', component: MatchQueue},
    { path: 'home', component: Home },
    { path: '**', redirectTo:'home' }
];
