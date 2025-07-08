import { WebSocketService } from "./web-socket-service";
import { initialize, step, shoot, move } from "../gamelogic/game-state";
import { maxStepSize, serverStepSize, isDef } from "./common";

const wss = new WebSocketService();
wss.setDelay(0);
initialize();

let clientInfo;
let currentState;
let serverStates;
let unprocessedInputs;

export function moveTo (x, y) {
  if (clientInfo) {
    console.log(x, y, clientInfo);
    wss.emit("game.move", { x, y, gameId: clientInfo.gameId, clientIdx: clientInfo.clientIdx });
    unprocessedInputs.push({
      timestamp: Date.now() - serverStepSize,
      action: "move",
      x,
      y
    })
  }
}

export function shootBullet (x, y) {
  if (clientInfo) {
    wss.emit("game.shoot", { x, y, gameId: clientInfo.gameId, clientIdx: clientInfo.clientIdx });
    unprocessedInputs.push({
      timestamp: Date.now() - serverStepSize,
      action: "move",
      x,
      y
    })
  }
}

export function join (cb) {
  wss.bindHandler("match.join", (match) => {
    cb();

    wss.unbindHandlers("match.join");
    currentState = match.initialState;
    serverStates = [];
    unprocessedInputs = [];

    wss.bindHandler("match.stateUpdate", (res) => {
      serverStates = res.newStates.concat(serverStates).sort((a, b) => a.timestamp - b.timestamp);
    })
  });

  wss.emit("match.joinRequest", { }, (c) => {
    clientInfo = c;
  });
}

export function fetchFrame () {
  if (!clientInfo || !currentState) return;

  // for every unprocessed input if there exists a state in
  // serverStates that has a greater timestamp than the unprocessed input
  // then that input has already been processed

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

  unprocessedInputs = unprocessedInputs.filter((u) => {
    u.timestamp > headTime;
  })

  // note: we don't have to compensate for lag because the lastComputedState is
  // the current state from -100ms ago
  while (targetTime !== headTime) {
    serverStates.filter((s) => s.timestamp > headTime);
    let delta = 0;

    const input = unprocessedInputs[0];
    console.assert(!isDef(input) || ((headTime < input.timestamp && input.timestamp < targetTime)), "non-null input w/ incorrect timestamp");

    delta = Math.min(maxStepSize, targetTime - headTime);

    if (input && input.timestamp - headTime < delta) {
      delta = input.timestamp - delta;
      unprocessedInputs.shift();

      const { x, y } = input;
      switch (input.action) {
        case "shoot":
          shoot(currentState, clientInfo.clientIdx, x, y);
        break;
        case "move":
          move(currentState, clientInfo.clientIdx, x, y);
        break;
        default:
          console.error(`Error: action ${input.action} not found.`);
      }
    }

    console.assert(delta > 0, "negative delta");

    step(currentState, delta);
    headTime += delta;
  }

  return currentState;
}

export function getDistance(idx) {
  const t1 = currentState.tanks[idx];
  if (!t1 || !currentState) return;

  const t2 = currentState.tanks.clientInfo[clientInfo.clientIdx];
  assert(isDef(t2), "null client tank");

  return Math.sqrt(
    (t1.sprite.x - t2.sprite.x) ** 2 + (t1.sprite.y - t2.sprite.y) ** 2
  );
}

export function getClientIdx() {
  console.assert(isDef(clientInfo), "null clientInfo");
  return clientInfo.clientIdx;
}