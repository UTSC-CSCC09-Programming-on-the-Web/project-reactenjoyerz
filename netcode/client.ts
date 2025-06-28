import { WebSocketService } from "./web-socket-service.ts";

const wss = new WebSocketService();
let g_user = ""

type MatchInfo = {
  id: number,
};

wss.bindHandler("match.join", (match: MatchInfo) => {
  wss.unbindHandlers("match.join");
  console.log(`${g_user} joining room ${match.id} ...`);
})

export function join (user: string): void {
  console.log(`${user} joining ...`);
  g_user = user;
  wss.emit("match.joinRequest", { user });
}
