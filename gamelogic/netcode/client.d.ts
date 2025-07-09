import { GameState, Sprite } from "../gamelogic/game-state";

export function moveTo (x: number, y: number): void;
export function shootBullet (x: number, y: number): void;
export function join (cb: () => void): void;
export function fetchFrame () : GameState;
export function getDistance(idx1: number) : number;
export function getClientIdx(): number;
export function hasStarted(): boolean;