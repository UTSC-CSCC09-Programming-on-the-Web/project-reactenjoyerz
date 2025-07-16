import { WebSocketService } from "../../frontend/src/app/services/web-socket.service";
import {
  initialize,
  step,
  shoot,
  move,
  setWalls,
  removeTank,
} from "../gamelogic/game-state";
import { maxStepSize, serverStepSize, isDef } from "./common";

let wss;

let clientInfo;
let currentState;
let serverStates;
let started = false;

export function initClient(socketService) {
  console.log("Initializing client.js with shared WebSocketService.");
  wss = socketService;
}

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
    serverStates = [];

    setWalls(match.walls);

    wss.bindHandler("match.stateUpdate", (res) => {
      serverStates = res.newStates;
      if (isDef(res.updatedIndices)) {
        console.log(res);
        console.log(`old idx: ${clientInfo.clientIdx}`);
        clientInfo.clientIdx = res.updatedIndices[clientInfo.clientIdx];
        console.log(`new idx: ${clientInfo.clientIdx}`);
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

  let idx;
  for (idx = serverStates.length - 1; idx >= 0; idx--) {
    if (serverStates[idx].timestamp <= targetTime) {
      currentState = serverStates[idx];
      break;
    }
  }

  let headTime = currentState.timestamp;
  if (idx !== -1) serverStates = serverStates.slice(idx + 1);
  else serverStates = [];

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
  clientInfo = undefined;
  currentState = undefined;
  serverStates = [];
  started = false;

  wss.unbindHandlers("match.stateUpdate");
  wss.unbindHandlers("match.playerChange");
}

export function getClientInfo() {
  return clientInfo;
}
