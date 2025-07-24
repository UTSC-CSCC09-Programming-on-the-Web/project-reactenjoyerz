import {
  isDef,
  serverStepSize,
  maxStepSize,
  inputCooldown,
  matchSize,
  MAX_PROXIMITY_DISTANCE,
} from "./common.js";
import {
  initialize,
  step,
  shoot,
  move,
  getWalls,
  logState,
  removeTank,
  stopTank,
  moveVec,
  updateTimestamp
} from "../gamelogic/game-state.js";

import assert from "node:assert";
const speakingStatus = new Map();

let nextGameId = 0;
const games = new Map([]);

export function bindWSHandlers(io) {
  io.on("connection", (socket) => {
    const handlePlayerLeave = ({ clientIdx, gameId }) => {
      console.log(`Player ${clientIdx} left game-${gameId}`);
      socket.disconnect();

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
        io.to(game.name).emit("match.playerChange", { clientIdx });
      }

      game.players.splice(clientIdx, 1);
    };

    socket.on("disconnect", () =>
      console.error("Warning: Unhandled player leave!")
    );

    socket.on("match.leave", handlePlayerLeave);

    socket.on("match.joinRequest", ({}, callback) => {
      let game = games.get(nextGameId);

      if (!game) {
        game = {
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

    socket.on("game.shoot", ({ x, y, gameId, clientIdx }) => {
      const game = games.get(gameId);
      if (!game || !game.started) return;

      // if clientIdx is out of bounds return
      if (0 > clientIdx || clientIdx >= game.players.length) return;

      const now = Date.now();
      assert(isDef(clientIdx) && isDef(gameId));
      updateTimestamp(game.currentState, now);
      shoot(game.currentState, clientIdx, x, y);

      io.to(`game-${gameId}`).emit("match.stateUpdate", {
        newState: game.currentState,
        clientIdx,
      });
    });

    socket.on("game.moveVec", ({ dx, dy, gameId, clientIdx }) => {
      const game = games.get(gameId);
      if (!game || !game.started) return;

      // if clientIdx is out of bounds return
      if (0 > clientIdx || clientIdx >= game.players.length) return;
      else if (game.currentState.tanks[clientIdx].dx === dx && game.currentState.tanks[clientIdx].dy === dy) return;

      const now = Date.now();

      assert(isDef(clientIdx) && isDef(gameId));
      updateTimestamp(game.currentState, now);
      moveVec(game.currentState, clientIdx, dx, dy);
      io.to(`game-${gameId}`).emit("match.stateUpdate", {
        newState: game.currentState,
        clientIdx,
      });
    });

    socket.on("game.stop", ({ gameId, clientIdx }) => {
      const game = games.get(gameId);
      if (!game || !game.started) return;

      // if clientIdx is out of bounds return
      if (0 > clientIdx || clientIdx >= game.players.length) return;
      else if (game.currentState.tanks[clientIdx].dx === 0 && game.currentState.tanks[clientIdx].dy === 0) return;

      const now = Date.now();

      assert(isDef(clientIdx) && isDef(gameId));

      updateTimestamp(game.currentState, now);
      stopTank(game.currentState, clientIdx);
      io.to(`game-${gameId}`).emit("match.stateUpdate", {
        newState: game.currentState,
        clientIdx,
      });
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
  });
}
