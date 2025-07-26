import { GameState, Sprite } from "../gamelogic/game-state";
import { ErrorCode } from "./common";

export function moveTo (x: number, y: number): void;
export function shootBullet (x: number, y: number): void;
export function join(
  onJoin: () => void,
  onFail: (err: number) => void,
  onGameEnd: (score: { name: string; score: number }[]) => void,
  room: { roomId: number | undefined; password: string }
): void;
export function createRoom(
  onJoin: () => void,
  onFail: (err: number) => void,
  onGameEnd: (score: { name: string; score: number }[]) => void,
  room: { playerLimit: undefined; password: string }
): void;
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