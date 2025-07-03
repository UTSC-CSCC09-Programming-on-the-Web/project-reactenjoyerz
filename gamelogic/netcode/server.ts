import { io } from "./app.js";
import { InputFrame, InputRequest, serverStepSize, maxStepSize } from "./common.ts";
import { GameState, initialize, step, shoot, move } from "../gamelogic/game-state.ts";

import assert from "node:assert";

// Most of this (auth) shouldn't be handled here and should be put in the express
// session
type MatchJoinRequest = {
  userId: number,
}

type Game = {
  currentState?: GameState,
  inputs: InputFrame[],
  players: number[],
  name: string,
  started: boolean,
}

let nextGameId = 0;
const games: Map<number, Game> = new Map<number, Game>([]);

io.on("connection", (socket) => {
  socket.on("disconnect", () => {

  });

  socket.on("match.joinRequest", (user: MatchJoinRequest, callback) => {
    let game = games.get(nextGameId);

    if (!game) {
      game = {
        inputs: [],
        players: [],
        name: `game-${nextGameId}`,
        started: false,
      };

      games.set(nextGameId, game);
    }

    // send identification back to client
    // note: this is going to be removed in the future and integrated into
    // express-session
    callback({
      gameId: nextGameId,
      clientIdx: game.players.length,
    })

    game.players.push(user.userId);
    socket.join(`game-${nextGameId}`);
    console.log(`${user.userId} joined game-${nextGameId}.`);;

    if (game.players.length === 2) {
      console.log(`Starting game-${nextGameId}`);
      game.started = true;
      game.currentState = initialize();

      io.to(`game-${nextGameId}`).emit({
        initialState: game.currentState,
      });

      nextGameId++;
    }
  });

  socket.on("game.shoot", (input: InputRequest) => {
    const game = games.get(input.gameId);
    if (game && game.started) {
      game.inputs.push({
        req: input,
        timestamp: Date.now() - serverStepSize,
        action: "shoot",
      });

      console.log(`Shoot req @ ${Date.now() - serverStepSize}`);
    }
  });

  socket.on("game.move", (input: InputRequest) => {
    const game = games.get(input.gameId);
    if (game && game.started) {
      game.inputs.push({
        req: input,
        timestamp: Date.now() - serverStepSize,
        action: "move",
      });

      console.log(`Move req @ ${Date.now() - serverStepSize}`);
    }
  });
});

setInterval(() => {
  games.forEach((game) => {
    if (!game.started)
      return;

    assert(game.currentState);

    // don't ship currentState since that was part of the previous shipment
    const newStates: GameState[] = [];

    // 1. process inputs relative to state (from -100ms ago) to compute new
    // current state (0 ms) to account for input delay

    // 2 .compute changes in state from -100ms to 0ms

    // 3 .set current state to 0ms state


    let headTime = game.currentState.timestamp;
    const targetTime = Date.now();

    while (targetTime !== headTime) {
      let delta = 0;

      const input = game.inputs[0];
      assert(!input || ((headTime < input.timestamp && input.timestamp < targetTime)));

      delta = targetTime - headTime;
      if (input && input.timestamp - headTime < delta) {
        delta = input.timestamp - delta;
        game.inputs.shift();

        const { clientIdx, x, y } = input.req;
        switch (input.action) {
          case "shoot":
            shoot(game.currentState, clientIdx, x, y);
          break;
          case "move":
            move(game.currentState, clientIdx, x, y);
          break;
          default:
            console.error(`Error: action ${input.action} not found.`);
        }
      }

      assert(delta > 0);

      // only ship new state if step isn't a normal one
      if (delta <= maxStepSize) {
        step(game.currentState, delta);
        newStates.push(structuredClone(game.currentState));

      } else {
        delta = maxStepSize;
        step(game.currentState, delta);
      }

      headTime += delta;
    }

    // 4. ship it to clients
    io.to(game.name).emit("match.stateUpdate", { newStates })
  })
}, serverStepSize);

console.log("Server initialized ...");
