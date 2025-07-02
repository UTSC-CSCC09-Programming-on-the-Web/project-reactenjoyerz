import { WebSocketService } from "./web-socket-service.ts";
import * as Game from "../gamelogic/game-state.ts";

const wss = new WebSocketService();
const game = Game.initialize();
Game.logState(game);

let g_user = ""

type MatchInfo = {
  id: number,
};

wss.bindHandler("match.join", (match: MatchInfo) => {
  wss.unbindHandlers("match.join");
  console.error(`${g_user} joining room ${match.id} ...`);
})

export function moveTo (x: number, y: number): void {
  wss.emit("game.move", { x, y });
}

export function shoot (x: number, y: number): void {
  wss.emit("game.shoot", { x, y });
}

export function join (user: string): void {
  console.error(`${user} joining ...`);
  g_user = user;
  wss.emit("match.joinRequest", { user });
}
