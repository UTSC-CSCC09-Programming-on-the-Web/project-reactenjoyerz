import { getScores } from "../gamelogic/game-state";
import { getWalls, removeTank, updateTimestamp } from "../gamelogic/game-state";
import { isDef } from "./common";

let wss;

let clientInfo;
let currentState;
let serverState;
let started = false;
let gameEnds;
let players;
let prevScores = [];

export function initClient(socketService) {
  console.log("Initializing client.js with shared WebSocketService.");
  wss = socketService;
}

export function createRoom(onWait, onJoin, onFail, onGameEnd, room) {
  if (!isDef(room.playerLimit) || !isDef(room.password)) return onFail(ErrorCode.UnauthorizedJoin);
  startGame(onJoin, onFail, onGameEnd);
  
  wss.emit("match.createRoom", room, (c) => {
    clientInfo = c;
    onWait();
  })
}

export function join(onWait, onJoin, onFail, onGameEnd, room) {
  const body = { };
  if (room.gameId !== undefined) {
    body.gameId= room.gameId;
    body.password = room.password;
  }

  startGame(onJoin, onFail, onGameEnd);

  wss.emit("match.joinRequest", body, (c) => {
    clientInfo = c;
    onWait();
  });
}

function startGame(onJoin, onFail, onGameEnd) {
  started = false;
  prevScores = undefined;

  wss.bindHandler("match.join", (match) => {
    started = true;
    gameEnds = match.ends;
    wss.unbindHandlers("match.join");
    currentState = match.initialState;
    serverState = undefined;
    players = match.players;

    wss.bindHandler("match.stateUpdate", (res) => {
      currentState = res.newState;
    });

    wss.bindHandler("match.playerChange", ({ clientIdx }) => {
      if (clientIdx < clientInfo.clientIdx) clientInfo.clientIdx -= 1;
      if (started) removeTank(currentState, clientIdx);
      players.splice(clientIdx, 1);
    });

    onJoin();
  });

  wss.bindHandler("server.error", ({ err }) => {
    if (onFail(err)) leave();
  });

  wss.bindHandler("match.end", ({ finalState }) => {

    prevScores = getScores(finalState, players);
    destroyGame();
    onGameEnd();
  })
}

function destroyGame() {
  if (currentState === undefined)
    prevScores = undefined;
  else
    prevScores = getScores(currentState, players);
  clientInfo = undefined;
  currentState = undefined;
  serverState = undefined;
  gameEnds = undefined;
  players = undefined;
  started = false;

  wss.unbindHandlers("match.stateUpdate");
  wss.unbindHandlers("Unauthorized");
  wss.unbindHandlers("game.end");
  wss.unbindHandlers("match.end");
  wss.unbindHandlers("server.error");
}

export function fetchFrame() {

  const targetTime = Date.now();
  if (updateTimestamp(currentState, targetTime, true))
    wss.emit("game.syncReq", {});
  return currentState;
}

export function getDistance(idx) {

  // 1. Add a check to ensure clientInfo and currentState are initialized
  if (!clientInfo || !currentState) {
    return;
  }

  const t1 = currentState.tanks[idx].dSprite;

  // 2. Correctly access the client's tank from the tanks array
  const t2 = currentState.tanks[clientInfo.clientIdx].dSprite;

  // 3. Add a check to ensure both tank objects exist before using them
  if (!t1 || !t2) {
    return;
  }

  return Math.sqrt(
    (t1.sprite.x - t2.sprite.x) ** 2 + (t1.sprite.y - t2.sprite.y) ** 2
  );
}

export function getClientIdx() {
  return clientInfo.clientIdx;
}

export function hasStarted() {
  return started;
}

export function leave() {
  if (!isDef(clientInfo)) return;
  wss.emit("match.leave", { });
  destroyGame();
}

export function getClientInfo() {
  return clientInfo;
}


export function shootBullet(x, y) {
  wss.emit("game.shoot", {
    x,
    y,
  });
}

export function setDirection(dx, dy) {
  const tank = currentState.tanks[clientInfo.clientIdx].dSprite;
  if (tank.dx === dx && tank.dy === dy) return;
  wss.emit("game.moveVec", {
    dx,
    dy,
  });
}

export function shootBulletVec(dx, dy) {
  const tankSprite = currentState.tanks[clientInfo.clientIdx].dSprite.sprite;
  shootBullet(tankSprite.x + dx, tankSprite.y + dy);
}

export function stop() {

  const tank = currentState.tanks[clientInfo.clientIdx].dSprite;
  if (tank.dx === 0 && tank.dy === 0) return;

  wss.emit("game.stop", { })
}

export function getTimeLeft() {
  return Math.max(Math.ceil((gameEnds - Date.now()) / 1000), 0)
}

export function fetchScores() {
  return getScores(currentState, players);
}

export function fetchOldScores() {
  return prevScores;
}

export function isWaiting() {
  return isDef(clientInfo);
}