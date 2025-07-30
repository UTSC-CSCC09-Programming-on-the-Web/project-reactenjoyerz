import { GameState, Sprite } from "../gamelogic/game-state";
import { ErrorCode } from "./common";

export type Scores = {
  score: number, 
  name: string, 
  clientIdx: number 
}[];

export function moveTo (x: number, y: number): void;
export function shootBullet (x: number, y: number): void;
export function join(
  onWait: () => void,
  onJoin: () => void,
  onFail: (err: number) => void,
  onGameEnd: () => void,
  room: { gameId: number | undefined, password: string | undefined }
): void;
export function createRoom(
  onWait: () => void,
  onJoin: () => void,
  onFail: (err: number) => boolean,
  onGameEnd: () => void,
  room: { playerLimit: number, password: string | undefined }
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
export function getTimeLeft(): number;
export function fetchScores(): Scores;
export function fetchOldScores(): Scores | undefined;
export function isWaiting(): boolean;