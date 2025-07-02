import { GameState } from "../gamelogic/game-state.ts";

export type InputRequest = {
  x: number,
  y: number,
};

export type InputFrame = {
  req: InputRequest,
  timestamp: number,
  action: string,
}

export type Game = {
  states: GameState[],
  inputs: InputFrame[],
  name: string,
}

