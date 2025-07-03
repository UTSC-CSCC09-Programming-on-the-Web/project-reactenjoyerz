import { WebSocketService } from "./web-socket-service.ts";
import { GameState, Tank, initialize, logState, step, shoot, move } from "../gamelogic/game-state.ts";
import { maxStepSize, serverStepSize } from "./common.ts";
import assert from "node:assert";

const wss = new WebSocketService();
const game = initialize();
logState(game);

type MatchInfo = {
  initialState: GameState,
};

type ClientInfo = {
  gameId: number,
  clientIdx: number,
}

type UnprocessedInput = {
  timestamp: number,
  action: string,
  x: number,
  y: number,
};

type NewMatchStates = {
  newStates: GameState[],
}

let clientInfo: ClientInfo;
let currentState: GameState;
let serverStates: GameState[];
let unprocessedInputs: UnprocessedInput[];

wss.bindHandler("match.join", (match: MatchInfo) => {
  wss.unbindHandlers("match.join");
  currentState = match.initialState;
  serverStates = [];
  unprocessedInputs = [];

  wss.bindHandler("match.stateUpdate", (res: NewMatchStates) => {
    serverStates = res.newStates.concat(serverStates).sort((a, b) => a.timestamp - b.timestamp);
  })
})

export function moveTo (x: number, y: number): void {
  if (clientInfo) {
    wss.emit("game.move", { x, y, gameId: clientInfo.gameId, clientIdx: clientInfo.clientIdx });
    unprocessedInputs.push({
      timestamp: Date.now() - serverStepSize,
      action: "move",
      x,
      y
    })
  }
}

export function shootBullet (x: number, y: number): void {
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

export function join (userId: number): void {
  wss.emit("match.joinRequest", { userId }, (c: ClientInfo) => {
    clientInfo = c;
  });
}

export function fetchFrame () : GameState | undefined {
  if (!clientInfo || !currentState) return;

  // for every unprocessed input if there exists a state in
  // serverStates that has a greater timestamp than the unprocessed input
  // then that input has already been processed

  const targetTime = Date.now();
  const frameIdx = serverStates.findLastIndex((s) => {
    currentState.timestamp <= s.timestamp && s.timestamp <= targetTime;
  })

  currentState = serverStates[frameIdx-1] || currentState;
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
    assert(!input || ((headTime < input.timestamp && input.timestamp < targetTime)));

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

    assert(delta > 0);

    step(currentState, delta);
    headTime += delta;
  }

  return currentState;
}

export function getDistance(idx1: number, idx2: number) : number | undefined{
  if (!(0 <= idx1 && idx1 < currentState.tanks.length)) return;
  if (!(0 <= idx2 && idx2 < currentState.tanks.length)) return;

  const t1: Tank = currentState.tanks[idx1];
  const t2: Tank = currentState.tanks[idx2];
  return Math.sqrt((t1.sprite.x - t2.sprite.x)**2 + (t1.sprite.y - t2.sprite.y)**2);
}
