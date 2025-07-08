import { isDef, serverStepSize, maxStepSize, inputCooldown } from "./common.js";
import { initialize, step, shoot, move, logState } from "../gamelogic/game-state.js";

import assert from "node:assert";

let nextGameId = 0;
const games = new Map([]);

export function bindWSHandlers(io) {

  io.on("connection", (socket) => {
    socket.on("disconnect", () => {});

    socket.on("match.joinRequest", ({}, callback) => {
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
      callback({
        gameId: nextGameId,
        clientIdx: game.players.length,
      });

      // D:
      game.players.push(1);
      socket.join(`game-${nextGameId}`);
      console.log(
        `Player ${game.players.length} of 2 joined game-${nextGameId}`
      );

      if (game.players.length === 2) {
        console.log(`Starting game-${nextGameId}`);
        game.started = true;
        game.currentState = initialize();
        game.currentState.timestamp = Date.now();

        io.to(`game-${nextGameId}`).emit("match.join", {
          initialState: game.currentState,
        });

        nextGameId++;
      }
    });

    socket.on("game.shoot", ({ x, y, gameId, clientIdx }) => {
      const game = games.get(gameId);
      if (!game || !game.started) return;

      // add rate limit
      const now = Date.now();
      const lastInput = game.inputs[game.inputs.length - 1];
      if (
        isDef(lastInput) &&
        now - lastInput.timestamp < inputCooldown &&
        lastInput.clientIdx === clientIdx
      )
        return;

      assert(isDef(clientIdx) && isDef(gameId));
      game.inputs.push({
        req: {
          x,
          y,
        },
        timestamp: Date.now(),
        action: "shoot",
        clientIdx: clientIdx,
        gameId: gameId,
      });

      console.log(`Shoot req @ ${Date.now() - serverStepSize}`);
    });

    socket.on("game.move", ({ x, y, gameId, clientIdx }) => {
      const game = games.get(gameId);
      if (!game || !game.started) return;

      // add rate limit
      const now = Date.now();
      const lastInput = game.inputs[game.inputs.length - 1];
      console.log(game.inputs);
      if (
        isDef(lastInput) &&
        now - lastInput.timestamp < inputCooldown &&
        lastInput.clientIdx === clientIdx
      )
        return;

      console.log(now);
      assert(isDef(clientIdx) && isDef(gameId));
      game.inputs.push({
        req: {
          x,
          y,
        },
        timestamp: Date.now(),
        action: "move",
        clientIdx,
        gameId,
      });

      console.log(`Move req @ ${Date.now() - serverStepSize}`);
    });
  });

  setInterval(() => {
    games.forEach((game, gameId) => {
      if (!game.started)
        return;

      assert(isDef(game.currentState));

      // don't ship currentState since that was part of the previous shipment
      const newStates = [];

      // 1. process inputs relative to state (from -100ms ago) to compute new
      // current state (0 ms) to account for input delay

      // 2 .compute changes in state from -100ms to 0ms

      // 3 .set current state to 0ms state


      let headTime = game.currentState.timestamp;
      const targetTime = Date.now();

      while (targetTime !== headTime) {
        let delta = 0;

        const input = game.inputs[0];
        let push = false;

        // ensure that no elements are going unprocessed
        assert(!isDef(input) || (headTime <= input.timestamp && input.timestamp <= targetTime));

        delta = Math.min(maxStepSize, targetTime - headTime);
        if (isDef(input) && input.timestamp - headTime < delta) {
          assert(input.gameId === gameId);

          push = true;
          delta = input.timestamp - delta;
          game.inputs.shift();

          const { x, y } = input.req;
          switch (input.action) {
            case "shoot":
              shoot(game.currentState, input.clientIdx, x, y);
              break;
            case "move":
              move(game.currentState, input.clientIdx, x, y);
              break;
            default:
              console.error(`Error: action ${input.action} not found.`);
          }

          newStates.push(structuredClone(game.currentState));
        }

        // only ship new state if step isn't a normal one
        step(game.currentState, delta);
        headTime += delta;
      }

      // 4. ship it to clients
      assert(game.currentState.timestamp === targetTime);
      if (newStates.length !== 0)
        io.to(game.name).emit("match.stateUpdate", { newStates });
    })
  }, serverStepSize);
}
