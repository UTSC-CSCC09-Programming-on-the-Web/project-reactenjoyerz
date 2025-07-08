import { GameState } from "../gamelogic/game-state";

export function moveTo (x: number, y: number): void;
export function shootBullet (x: number, y: number): void;
export function join (cb: () => void): void;
export function fetchFrame () : GameState | undefined;
export function getDistance(idx1: number) : number | undefined;
export function getClientIdx(): number;