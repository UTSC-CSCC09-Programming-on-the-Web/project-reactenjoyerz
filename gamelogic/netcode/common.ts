import { GameState } from "../gamelogic/game-state";

export const maxStepSize = 20; // ms
export const serverStepSize = 100;

export type InputRequest = {
  x: number,
  y: number,
};

export type InputFrame = {
  req: InputRequest,
  timestamp: number,
  action: string,
  gameId: number,
  clientIdx: number,
}
