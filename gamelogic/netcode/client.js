import { shoot, move, setWalls, removeTank, moveVec, stopTank, updateTimestamp } from "../gamelogic/game-state";
import { isDef } from "./common";

let wss;

let clientInfo;
let currentState;
let serverState;
let started = false;
let nextReqNo = 0;

export function initClient(socketService) {
  console.log("Initializing client.js with shared WebSocketService.");
  wss = socketService;
  wss.setDelay(0);
}

export function join(cb) {
  console.assert(!started, "join: already started");
  started = false;

  wss.bindHandler("match.join", (match) => {
    cb({
      initialState: match.initialState,
      walls: match.walls,
      clientInfo: clientInfo, // Pass the clientInfo received earlier
    });

    started = true;
    wss.unbindHandlers("match.join");
    currentState = match.initialState;
    serverState = undefined;

    setWalls(match.walls);

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
  });

  wss.emit("match.joinRequest", {}, (c) => {
    clientInfo = c;
  });
}

export function fetchFrame() {
  console.assert(started, "fetchFrame: not started");

  if (!currentState) {
    return { tanks: [], bullets: [] };
  }

  const targetTime = Date.now();
  return updateTimestamp(currentState, targetTime);
}

export function getDistance(idx) {
  console.assert(started, "getDistance: not started");

  // 1. Add a check to ensure clientInfo and currentState are initialized
  if (!clientInfo || !currentState) {
    return;
  }

  const t1 = currentState.tanks[idx];

  // 2. Correctly access the client's tank from the tanks array
  const t2 = currentState.tanks[clientInfo.clientIdx];

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
  wss.emit("match.leave", clientInfo);
  console.log(started, "client.leave match not started");
  clientInfo = undefined;
  currentState = undefined;
  serverState = undefined;
  started = false;

  wss.unbindHandlers("match.stateUpdate");
  wss.unbindHandlers("match.playerChange");
}

export function getClientInfo() {
  return clientInfo;
}


export function shootBullet(x, y) {
  console.assert(started, "shootBullet: not started");
  wss.emit("game.shoot", {
    x,
    y,
    gameId: clientInfo.gameId,
    clientIdx: clientInfo.clientIdx,
    reqNo: nextReqNo
  });

  //shoot(currentState, clientInfo.clientIdx, x, y);
  nextReqNo++;
}

export function setDirection(dx, dy) {
  console.assert(started, "client.setDirection match not started");
  console.assert(Math.abs(dx ** 2 + dy ** 2 - 1) <= 1e-5, "client.setDirection direction vector not normalized");
  console.assert(isDef(clientInfo), "client.setDirection clientInfo not defined");

  const tankSprite = currentState.tanks[clientInfo.clientIdx].sprite;

  //moveVec(currentState, clientInfo.clientIdx, dx, dy);
  wss.emit("game.moveVec", {
    dx,
    dy,
    gameId: clientInfo.gameId,
    clientIdx: clientInfo.clientIdx,
    reqNo: nextReqNo 
  });

  nextReqNo++;
}

export function shootBulletVec(dx, dy) {
  console.assert(started, "client.shootBulletVec match not started");
  console.assert(Math.abs(dx ** 2 + dy ** 2 - 1) <= 1e-5, "client.shootBulletVec vector not normalized");
  console.assert(isDef(clientInfo), "client.shootBulletVec clientInfo not defined");

  const tankSprite = currentState.tanks[clientInfo.clientIdx].sprite;
  shootBullet(tankSprite.x + dx, tankSprite.y + dy);
}

export function stop() {
  console.assert(started, "client.stop match not started");
  console.assert(isDef(clientInfo), "client.stop clientInfo not defined");

  stopTank(currentState, clientInfo.clientIdx);
  wss.emit("game.stop", {
    gameId: clientInfo.gameId,
    clientIdx: clientInfo.clientIdx,
  })
}