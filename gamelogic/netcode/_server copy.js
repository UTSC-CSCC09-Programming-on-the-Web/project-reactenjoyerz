import { serverStepSize, maxStepSize } from "./common.js";
import { initialize, step, shoot, move } from "../gamelogic/game-state.js";

import assert from "node:assert";

let nextGameId = 0;
const games = new Map([]);

export function bindWSHandlers(io) {

  io.on("connection", (socket) => {
    const session = socket.request.session;
    const req = socket.request;

    socket.use((__, next) => {
      session.reload((err) => {
        if (err) {
          console.error("session reload failed", err);
          socket.disconnect();
        } else {
          next();
        }
      });
    });

    socket.on("disconnect", () => {
      
    });

    socket.on("match.joinRequest", (user, callback) => {
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
      })

      session.clientIdx = game.players.length;
      session.gameId = nextGameId;
      session.save();

      game.players.push(session.userId);
      socket.join(`game-${nextGameId}`);
      console.log(`User id: ${session.userId} joined game-${nextGameId}. ${Date.now()}`);;

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

    socket.on("game.shoot", (input) => {
      const session = socket.request.session;
      const game = games.get(session.gameId);

      if (game && game.started) {
        assert(session.clientIdx && session.gameId)
        game.inputs.push({
          req: input,
          timestamp: Date.now() - serverStepSize,
          action: "shoot",
          clientIdx: session.clientIdx,
          gameId: session.gameId
        });

        console.log(`Shoot req @ ${Date.now() - serverStepSize}`);
      }
    });

    socket.on("game.move", (input) => {
      const session = socket.request.session;
      const game = games.get(session.gameId);

      if (game && game.started) {
        assert(session.clientIdx && session.gameId)
        game.inputs.push({
          req: input,
          timestamp: Date.now() - serverStepSize,
          action: "move",
          clientIdx: session.clientIdx,
          gameId: session.gameId
        });

        console.log(`Move req @ ${Date.now() - serverStepSize}`);
      }
    });
  });

  setInterval(() => {
    games.forEach((game, gameId) => {
      if (!game.started)
        return;

      assert(game.currentState);

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
        assert(!input || ((headTime < input.timestamp && input.timestamp < targetTime)));

        delta = targetTime - headTime;
        if (input && input.timestamp - headTime < delta) {
          assert(input.gameId === gameId);

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
}
