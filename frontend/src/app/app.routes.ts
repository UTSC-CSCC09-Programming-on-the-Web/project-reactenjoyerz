import { Routes } from '@angular/router';
import { GameBoard } from './game-board/game-board';
import { Home } from './home/home'
import { MatchQueue } from './match-queue/match-queue';
import { Login } from './login/login'
import { Register } from './register/register'
import { Subscribe } from './subscribe/subscribe';
import { AuthGuard } from './services/auth.guard';
import { GoogleLogin } from './google-login/google-login';
import { GameGuard } from './services/game.guard';
import { HowToPlay } from './how-to-play/how-to-play';
import { Leaderboard } from './leaderboard/leaderboard';
import { Create } from './create/create';
import { Join } from './join/join';
import { WaitingGuard } from './services/waiting.guard.';
import { GameSelect } from './game-select/game-select';

export const routes: Routes = [
    { path: 'game', component: GameBoard, canActivate: [AuthGuard, GameGuard] },
    { path: 'match', component: MatchQueue, canActivate: [AuthGuard, WaitingGuard] },
    { path: 'home', component: Home },
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    { path: 'google-login', component: GoogleLogin },
    { path: 'how-to-play', component: HowToPlay },
    { path: 'subscribe', component: Subscribe, canActivate: [AuthGuard] },
    { path: 'leaderboard', component: Leaderboard, canActivate: [AuthGuard] },
    { path: 'create', component: Create, canActivate: [AuthGuard] },
    { path: 'join', component: Join, canActivate: [AuthGuard] },
    { path: 'game-select', component: GameSelect, canActivate: [AuthGuard] },
    { path: '**', redirectTo: 'home' }
];
