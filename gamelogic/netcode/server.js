import { isDef, serverStepSize, maxStepSize, inputCooldown, matchSize } from "./common.js";
import { initialize, step, shoot, move, getWalls, logState, removeTank, stopTank, moveVec } from "../gamelogic/game-state.js";

import assert from "node:assert";
const speakingStatus = new Map();

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
      game.players.push(socket);
      socket.join(`game-${nextGameId}`);
      console.log(
        `Player ${game.players.length} of ${matchSize} joined game-${nextGameId}`
      );

      if (game.players.length === matchSize) {
        console.log(`Starting game-${nextGameId}`);
        game.started = true;

        game.currentState = initialize(matchSize);
        game.currentState.timestamp = Date.now();

        io.to(`game-${nextGameId}`).emit("match.join", {
          initialState: game.currentState,
          walls: getWalls(),
        });

        nextGameId++;
      }
    });

    socket.on("match.leave", ({ clientIdx, gameId }) => {
      console.log(`Player ${clientIdx} left game-${gameId}`);
      socket.leave(`game-${gameId}`);

      const game = games.get(gameId);
      if (!isDef(game)) return;
      assert(isDef(game.players[clientIdx]));

      if (game.players.length === 1) {
        games.delete(gameId);
        console.log(`Deleting game-${gameId}`);
        return;
      }

      if (game.started) {
        removeTank(game.currentState, clientIdx);
        game.inputs = game.inputs.filter((input) => {
          clientIdx === input.clientIdx && gameId === input.gameId;
        });

        game.inputs.forEach((input) => {
          input.clientIdx =
            input.clientIdx < clientIdx ? clientIdx : clientIdx - 1;
        });

        io.to(game.name).emit("match.playerChange", { clientIdx });
      }

      game.players.splice(clientIdx, 1);
    });

    socket.on("game.shoot", ({ x, y, gameId, clientIdx }) => {
      const game = games.get(gameId);
      if (!game || !game.started) return;

      // if clientIdx is out of bounds return
      if (0 > clientIdx || clientIdx >= game.players.length) return;

      const now = Date.now();

      assert(isDef(clientIdx) && isDef(gameId));
      game.inputs.push({
        x,
        y,
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

      // if clientIdx is out of bounds return
      if (0 > clientIdx || clientIdx >= game.players.length) return;

      const now = Date.now();

      assert(isDef(clientIdx) && isDef(gameId));
      game.inputs.push({
        x,
        y,
        timestamp: Date.now(),
        action: "move",
        clientIdx,
        gameId,
      });

      console.log(`Move req @ ${Date.now() - serverStepSize}`);
    });

    socket.on("voice.start", ({ gameId, clientIdx }) => {
      console.log(`Player ${clientIdx} in game ${gameId} started talking.`);
      if (!speakingStatus.has(gameId)) {
        speakingStatus.set(gameId, new Map());
      }
      speakingStatus.get(gameId).set(clientIdx, true);
      // Notify other clients in the room that this player started talking (for UI)
      io.to(`game-${gameId}`).emit("voice.playerStartedTalking", {
        senderClientIdx: clientIdx,
      });
    });

    socket.on("voice.stop", ({ gameId, clientIdx }) => {
      console.log(`Player ${clientIdx} in game ${gameId} stopped talking.`);
      if (speakingStatus.has(gameId)) {
        speakingStatus.get(gameId).set(clientIdx, false);
      }
      // Notify other clients in the room that this player stopped talking (for UI)
      io.to(`game-${gameId}`).emit("voice.playerStoppedTalking", {
        senderClientIdx: clientIdx,
      });
    });

    socket.on("voice.audioChunk", ({ gameId, clientIdx, chunk }) => {
      console.log(
        `--- SERVER RECEIVED 'voice.audioChunk' from client ${clientIdx} in game ${gameId} ---`
      );

      const game = games.get(gameId);
      if (!game || !game.started || !game.currentState) return;

      if (
        !speakingStatus.has(gameId) ||
        !speakingStatus.get(gameId).get(clientIdx)
      ) {
        // console.warn(`Received audio chunk from non-speaking player ${clientIdx} in game ${gameId}.`);
        return;
      }

      const senderTank = game.currentState.tanks[clientIdx];
      if (!senderTank) {
        console.warn(
          `Sender tank ${clientIdx} not found for audio chunk in game ${gameId}.`
        );
        return;
      }

      // Iterate through all players in the game to determine proximity
      game.players.forEach((receiverSocket, receiverIdx) => {
        // Don't send audio back to the person who is talking.
        if (receiverIdx === clientIdx) return;

        const receiverTank = game.currentState.tanks[receiverIdx];
        if (!receiverTank) return;

        // Calculate the distance between the sender and the receiver.
        const distance = Math.sqrt(
          Math.pow(senderTank.sprite.x - receiverTank.sprite.x, 2) +
            Math.pow(senderTank.sprite.y - receiverTank.sprite.y, 2)
        );
        console.log(
          `[Game ${gameId}] Proximity Check: Sender ${clientIdx} to Receiver ${receiverIdx}. Distance: ${distance.toFixed(
            2
          )}`
        );

        if (distance <= MAX_PROXIMITY_DISTANCE) {
          console.log(
            `[Game ${gameId}] Distance OK. Sending audio from ${clientIdx} to Receiver ${receiverIdx}.`
          );
          receiverSocket.emit("voice.playerAudio", {
            senderClientIdx: clientIdx,
            chunk: chunk,
          });
        }
      });
    });

    socket.on("game.moveVec", ({ dx, dy, gameId, clientIdx }) => {
      const game = games.get(gameId);
      if (!game || !game.started) return;

      // if clientIdx is out of bounds return
      if (0 > clientIdx || clientIdx >= game.players.length) return;

      const now = Date.now();

      assert(isDef(clientIdx) && isDef(gameId));
      game.inputs.push({
        dx,
        dy,
        timestamp: Date.now(),
        action: "moveVec",
        clientIdx,
        gameId,
      });

      console.log(`Move vec req @ ${Date.now() - serverStepSize}`);
    });

    socket.on("game.stop", ({ gameId, clientIdx }) => {
      const game = games.get(gameId);
      if (!game || !game.started) return;

      // if clientIdx is out of bounds return
      if (0 > clientIdx || clientIdx >= game.players.length) return;

      const now = Date.now();

      assert(isDef(clientIdx) && isDef(gameId));
      game.inputs.push({
        timestamp: Date.now(),
        action: "stop",
        clientIdx,
        gameId,
      });

      console.log(`Stop req @ ${Date.now() - serverStepSize}`);
    });
  });

  setInterval(() => {
    games.forEach((game, gameId) => {
      if (!game.started) return;

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
        assert(
          !isDef(input) ||
            (headTime <= input.timestamp && input.timestamp <= targetTime)
        );
        assert(headTime <= targetTime);

        delta = Math.min(maxStepSize, targetTime - headTime);
        if (isDef(input) && input.timestamp - headTime < delta) {
          assert(input.gameId === gameId);

          push = true;
          delta = input.timestamp - headTime;
          game.inputs.shift();

          switch (input.action) {
            case "shoot":
              shoot(game.currentState, input.clientIdx, input.x, input.y);
              break;
            case "move":
              move(game.currentState, input.clientIdx, input.x, input.y);
              break;
            case "stop":
              stopTank(game.currentState, input.clientIdx);
              break;
            case "moveVec":
              moveVec(game.currentState, input.clientIdx, input.dx, input.dy);
              break;
            default:
              console.error(`Error: action ${input.action} not found.`);
          }

          newStates.push(structuredClone(game.currentState));
        }

        // only ship new state if step isn't a normal one
        assert(0 <= delta);
        assert(delta <= maxStepSize);

        step(game.currentState, delta);
        headTime += delta;
      }

      // 4. ship it to clients
      assert(game.currentState.timestamp === targetTime);

      if (newStates.length !== 0)
        io.to(game.name).emit("match.stateUpdate", { newStates });
    });
  }, serverStepSize);
}
