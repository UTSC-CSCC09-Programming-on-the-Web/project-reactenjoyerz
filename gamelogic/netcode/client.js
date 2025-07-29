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

export function initClient(socketService) {
  console.log("Initializing client.js with shared WebSocketService.");
  wss = socketService;
}

export function createRoom(onWait, onJoin, onFail, onGameEnd, room) {
  if (!isDef(room.playerLimit) || !isDef(room.password)) return onUnauthorized(ErrorCode.UnauthorizedJoin);
  const body = {
    playerLimit: room.playerLimit,
    password: room.password,
  };

  startGame(onJoin, onFail, onGameEnd);
  
  wss.emit("match.createRoom", body, (c) => {
    clientInfo = c;
    onWait();
  })
}

export function join(onWait, onJoin, onFail, onGameEnd, room) {
  const body = { };
  if (room.gameId!== undefined) {
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
  console.assert(!started, "startGame: already started");
  started = false;

  wss.bindHandler("match.join", (match) => {
    console.assert(!started, "match.join: joining started match");
    started = true;
    gameEnds = match.ends;
    wss.unbindHandlers("match.join");
    currentState = match.initialState;
    serverState = undefined;
    players = match.players;

    wss.bindHandler("match.stateUpdate", (res) => {
      currentState = res.newState;
      console.assert(!isDef(res.updateIndices), "match.stateUpdate: updateIndices is deprecated");
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
    console.assert(!finalState.started)
    const scores = getScores(finalState, players);
    destroyGame();
    onGameEnd(scores);
  })
}

function destroyGame() {
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
  console.assert(started, "fetchFrame: not started");

  const targetTime = Date.now();
  if (updateTimestamp(currentState, targetTime, true))
    wss.emit("game.syncReq", {});
  return currentState;
}

export function getDistance(idx) {
  console.assert(started, "getDistance: not started");

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
  console.assert(started, "getClientIdx: not started");
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
  console.assert(started, "shootBullet: not started");
  wss.emit("game.shoot", {
    x,
    y,
  });
}

export function setDirection(dx, dy) {
  console.assert(started, "client.setDirection match not started");
  console.assert(Math.abs(dx ** 2 + dy ** 2 - 1) <= 1e-5, "client.setDirection direction vector not normalized");
  console.assert(isDef(clientInfo), "client.setDirection clientInfo not defined");

  const tank = currentState.tanks[clientInfo.clientIdx].dSprite;
  if (tank.dx === dx && tank.dy === dy) return;

  wss.emit("game.moveVec", {
    dx,
    dy,
  });
}

export function shootBulletVec(dx, dy) {
  console.assert(started, "client.shootBulletVec match not started");
  console.assert(Math.abs(dx ** 2 + dy ** 2 - 1) <= 1e-5, "client.shootBulletVec vector not normalized");
  console.assert(isDef(clientInfo), "client.shootBulletVec clientInfo not defined");

  const tankSprite = currentState.tanks[clientInfo.clientIdx].dSprite.sprite;
  shootBullet(tankSprite.x + dx, tankSprite.y + dy);
}

export function stop() {
  console.assert(started, "client.stop match not started");
  console.assert(isDef(clientInfo), "client.stop clientInfo not defined");

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