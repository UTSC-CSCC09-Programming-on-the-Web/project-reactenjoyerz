import { WebSocketService } from "./web-socket-service";
import { initialize, step, shoot, move } from "../gamelogic/game-state";
import { maxStepSize, serverStepSize, isDef } from "./common";

const wss = new WebSocketService();
wss.setDelay(0);
initialize();

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

    wss.bindHandler("match.stateUpdate", (res) => {
      serverStates = res.newStates.concat(serverStates).sort((a, b) => a.timestamp - b.timestamp);
    })
  });

  wss.emit("match.joinRequest", { }, (c) => {
    clientInfo = c;
  });
}

export function fetchFrame () {
  console.assert(started, "fetchFrame: not started");

  const targetTime = Date.now();
  if (serverStates.length !== 0)
    console.log(serverStates);

  for (let i = serverStates.length - 1; i >= 0; i--) {
    if (currentState.timestamp <= serverStates[i].timestamp && serverStates[i].timestamp <= targetTime) {
      currentState = serverStates[i];
      break;
    }
  }

  let headTime = currentState.timestamp;

  serverStates = serverStates.filter((s) => {
    s.timestamp > targetTime;
  })

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