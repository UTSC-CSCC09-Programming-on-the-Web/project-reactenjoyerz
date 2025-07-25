import { GameState, Sprite } from "../gamelogic/game-state";

export function moveTo (x: number, y: number): void;
export function shootBullet (x: number, y: number): void;
export function join (onJoin: () => void, onFail: () => void, onGameEnd: (score: { name: string, score: number }[]) => void): void;
export function fetchFrame () : GameState;
export function getDistance(idx1: number) : number;
export function getClientIdx(): number;
export function hasStarted(): boolean;
export function leave();
export function setDirection(dx: number, dy: number);
export function shootBulletVec(dx: number, dy: number);
export function stop();
export function getClientInfo(): { gameId: number, clientIdx: number };
export function initClient(socketService: WebSocketService): void;
export function setToken(token: string);