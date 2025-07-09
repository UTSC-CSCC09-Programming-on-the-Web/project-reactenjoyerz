import { WebSocketService } from "./web-socket-service";
import { initialize, step, shoot, move, setWalls } from "../gamelogic/game-state";
import { maxStepSize, serverStepSize, isDef } from "./common";

const wss = new WebSocketService();
wss.setDelay(0);

let clientInfo;
let currentState;
let serverStates;
let started = false;

export function moveTo(x, y) {
  console.assert(started, "moveTo: not started");
  wss.emit("game.move", {
    x,
    y,
    gameId: clientInfo.gameId,
    clientIdx: clientInfo.clientIdx,
  });
  move(currentState, clientInfo.clientIdx, x, y);
}

export function shootBullet(x, y) {
  console.assert(started, "shootBullet: not started");
  wss.emit("game.shoot", {
    x,
    y,
    gameId: clientInfo.gameId,
    clientIdx: clientInfo.clientIdx,
  });
  shoot(currentState, clientInfo.clientIdx, x, y);
}

export function join (cb) {
  console.assert(!started, "join: already started");
  started = false;

  wss.bindHandler("match.join", (match) => {
    cb();

    started = true;
    wss.unbindHandlers("match.join");
    currentState = match.initialState;
    serverStates = [];

    setWalls(match.walls);

    wss.bindHandler("match.stateUpdate", (res) => {
      serverStates =  res.newStates;
    });

    wss.bindHandler("match.playerChange", ({ updatedIndices }) => {
      console.log("old clientIdx: ", clientInfo.clientIdx)
      clientInfo.clientIdx = updatedIndices[clientInfo.clientIdx];
      console.log("new clientIdx: ", clientInfo.clientIdx)
    })
  });

  wss.emit("match.joinRequest", { }, (c) => {
    clientInfo = c;
  });
}

export function fetchFrame () {
  console.assert(started, "fetchFrame: not started");

  const targetTime = Date.now();

  let idx;
  for (idx = serverStates.length - 1; idx >= 0; idx--) {
    if (serverStates[idx].timestamp <= targetTime) {
      currentState = serverStates[idx];
      break;
    }
  }

  let headTime = currentState.timestamp;

  if (idx !== -1)
    serverStates = serverStates.slice(idx+1);
  else
    serverStates = []

  // note: we don't have to compensate for lag because the lastComputedState is
  // the current state from -100ms ago
  while (targetTime !== headTime) {
    serverStates.filter((s) => s.timestamp > headTime);
    let delta = 0;

    delta = Math.min(maxStepSize, targetTime - headTime);
    console.assert(delta > 0, "negative delta");

    step(currentState, delta);
    headTime += delta;
  }

  return structuredClone(currentState);
}

export function getDistance(idx) {
  console.assert(started, "getDistance: not started");
  const t1 = currentState.tanks[idx];
  if (!t1 || !currentState) return;

  const t2 = currentState.tanks.clientInfo[clientInfo.clientIdx];
  assert(isDef(t2), "null client tank");

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
  clientInfo = undefined;
  currentState = undefined;
  serverStates = [];
  started = false;
  
  wss.unbindHandlers("match.stateUpdate");
  wss.unbindHandlers("match.playerChange");
}