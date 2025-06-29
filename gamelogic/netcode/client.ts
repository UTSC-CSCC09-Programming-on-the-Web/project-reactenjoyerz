import { WebSocketService } from "./web-socket-service.ts";
import { GameBoard } from "../game_state.ts";
import { Bullet } from "../bullet.ts";

const wss = new WebSocketService();
const game = new GameBoard();

let g_user = ""

type MatchInfo = {
  id: number,
};

wss.bindHandler("match.join", (match: MatchInfo) => {
  wss.unbindHandlers("match.join");
  console.error(`${g_user} joining room ${match.id} ...`);
})

export function join (user: string): void {
  console.error(`${user} joining ...`);
  g_user = user;
  wss.emit("match.joinRequest", { user });
}
