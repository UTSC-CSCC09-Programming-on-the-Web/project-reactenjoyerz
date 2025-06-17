import { Component } from '@angular/core';
import { DynamicSprite } from './dynamic-sprite/dynamic-sprite';

@Component({
  selector: 'game-board',
  imports: [DynamicSprite],
  templateUrl: './game-board.html',
  styleUrl: './game-board.css',
})
export class GameBoard {}
