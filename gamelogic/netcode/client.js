import { getScores } from "../gamelogic/game-state";
import { getWalls, removeTank, updateTimestamp } from "../gamelogic/game-state";
import { isDef } from "./common";

let wss;

let clientInfo;
let currentState;
let serverState;
let started = false;
let token = "";

export function setToken(_token) {
  token = _token;
}

export function initClient(socketService) {
  console.log("Initializing client.js with shared WebSocketService.");
  wss = socketService;
  wss.setDelay(0);
}

export function createRoom(onWait, onJoin, onFail, onGameEnd, room) {
  if (!isDef(room.playerLimit) || !isDef(room.password)) return onUnauthorized(ErrorCode.UnauthorizedJoin);
  const body = {
    token,
    playerLimit: room.playerLimit,
    password: room.password,
  };

  wss.emit("match.createRoom", body, (c) => {
    clientInfo = c;
    onWait();
  })

  startGame(onJoin, onFail, onGameEnd);
}

export function join(onWait, onJoin, onFail, onGameEnd, room) {
  const body = { token };
  if (room.roomId !== undefined) {
    body.roomId = room.roomId;
    body.password = room.password;
  }

  wss.emit("match.joinRequest", body, (c) => {
    clientInfo = c;
    onWait();
  });

  startGame(onJoin, onFail, onGameEnd);
}

function startGame(onJoin, onFail, onGameEnd) {
  console.assert(!started, "startGame: already started");
  started = false;

  console.assert(token !== "", "join: null token");
  wss.bindHandler("match.join", (match) => {
    console.assert(!started, "match.join: joining started match");
    started = true;
    wss.unbindHandlers("match.join");
    currentState = match.initialState;
    serverState = undefined;

    wss.bindHandler("match.stateUpdate", (res) => {
      currentState = res.newState;
      if (isDef(res.updatedIndices)) {
        clientInfo.clientIdx = res.updatedIndices[clientInfo.clientIdx];
        fetchFrame();
      }
    });

    wss.bindHandler("match.playerChange", ({ clientIdx }) => {
      if (clientIdx < clientInfo.clientIdx) clientInfo.clientIdx -= 1;
      if (started) removeTank(currentState, clientIdx);
    });

    onJoin();
  });

  wss.bindHandler("server.error", ({ err }) => {
    if (onFail(err)) leave();
  });

  wss.bindHandler("match.end", ({ finalState }) => {
    console.log("Game ended!");
    console.log(finalState);
    destroyGame();
    onGameEnd(getScores(finalState));
  })
}

function destroyGame() {
  clientInfo = undefined;
  currentState = undefined;
  serverState = undefined;
  started = false;
  token = "";

  wss.unbindHandlers("match.stateUpdate");
  wss.unbindHandlers("Unauthorized");
  wss.unbindHandlers("game.end");
  wss.unbindHandlers("match.end");
  wss.unbindHandlers("server.error");
}

export function fetchFrame() {
  console.assert(started, "fetchFrame: not started");

  const targetTime = Date.now();
  return updateTimestamp(currentState, targetTime);
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
  //if (!isDef(clientInfo)) return;
  wss.emit("match.leave", { token });
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
    token
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
    token
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

  wss.emit("game.stop", {
    token
  })
}