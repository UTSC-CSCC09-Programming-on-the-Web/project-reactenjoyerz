import { WebSocketService } from "./web-socket-service.ts";
import * as Game from "../gamelogic/game-state.ts";

const wss = new WebSocketService();
const game = Game.initialize();
Game.logState(game);

type MatchInfo = {
  id: number,
};

type ClientInfo = {
  gameId: number,
  clientIdx: number,
}

let g_username = ""
let clientInfo: ClientInfo;


wss.bindHandler("match.join", (match: MatchInfo) => {
  wss.unbindHandlers("match.join");
  console.error(`${g_username} joining room ${match.id} ...`);
})

export function moveTo (x: number, y: number): void {
  if (clientInfo)
    wss.emit("game.move", { x, y, gameId: clientInfo.gameId, clientIdx: clientInfo.clientIdx });
}

export function shoot (x: number, y: number): void {
  if (clientInfo)
    wss.emit("game.shoot", { x, y, gameId: clientInfo.gameId, clientIdx: clientInfo.clientIdx });
}

export function join (user: string, userId: number): void {
  console.error(`${user} joining ...`);
  g_username = user;
  wss.emit("match.joinRequest", { user, userId }, (c: ClientInfo) => {
    clientInfo = c;
  });
}
