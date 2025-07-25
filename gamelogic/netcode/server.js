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
import {
  Router
} from "express";
import {
  findToken,
  updateClientInfo,
  findPlayerInfo,
} from "../../backend/token.js";

import assert from "node:assert";
const speakingStatus = new Map();

let nextGameId = 0;
const games = new Map([]);

function blockConnection(socket, reason) {
  console.error(`Unauthorized: ${reason}`);
  socket.emit("Unauthorized", {});
}

export function bindWSHandlers(io) {
  io.on("connection", (socket) => {
    socket.use((req, next) => {
      if (isDef(req[1].token)) {
        const playerInfo = findPlayerInfo(req[1].token);
        if (isDef(playerInfo)) {
          const { clientIdx, gameId, userId, name } = playerInfo;

          socket.clientIdx = clientIdx;
          socket.gameId = gameId;
          socket.token = req[1].token;
          socket.userId = userId;
          socket.name = name;
          return next();
        }

        return blockConnection(socket, "token not mapped to player info");
      } 

      return blockConnection(socket, "null token");
    });

    socket.on("disconnect", () =>
      console.error("Warning: Unhandled player leave!")
    );

    socket.on("match.joinRequest", ({}, callback) => {
      assert(isDef(socket.name));
      if (isDef(socket.gameId)) return blockConnection(socket, "player in game");

      const { token, userId, name } = socket;
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
      const gameId = nextGameId;
      const clientIdx = game.players.length;
      callback({
        gameId,
        clientIdx,
      });

      updateClientInfo(token, {
        gameId,
        clientIdx
      })

      // :D
      game.players.push({
        socket,
        name,
        userId,
      });

      socket.join(`game-${gameId}`);
      console.log(
        `${name} joined game-${gameId}`
      );

      if (game.players.length === matchSize) {
        console.log(`Starting game-${gameId}`);
        game.started = true;

        game.currentState = initialize(matchSize);
        game.currentState.timestamp = Date.now();

        io.to(`game-${gameId}`).emit("match.join", {
          initialState: game.currentState,
          walls: getWalls(),
          players: game.players.map((p) => p.name),
        });

        nextGameId++;
      }
    });

    socket.on("match.leave", () => {
      assert(isDef(socket.gameId));
      const { clientIdx, gameId, token, name } = socket;
      const ci = updateClientInfo(token, {});
      assert(ci.gameId === undefined); // ensure that token is able to be culled if it expires

      console.log(`${name} left game-${gameId}`);
      socket.disconnect();

      const game = games.get(gameId);
      game.players.forEach((player, idx) => {
        if (idx < clientIdx) return;
        const tokenInfo = findToken(player.userId);
        const clientInfo = findPlayerInfo(tokenInfo.token);
        clientInfo.clientIdx -= 1;
        updateClientInfo(tokenInfo.token, clientInfo);
      });

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
    });

    socket.on("game.shoot", ({ x, y }) => {
      assert(isDef(socket.gameId));
      const { clientIdx, gameId } = socket;

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

    socket.on("game.moveVec", ({ dx, dy }) => {
      assert(isDef(socket.gameId));
      const { clientIdx, gameId } = socket;

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

    socket.on("game.stop", ({ }) => {
      assert(isDef(socket.token));
      const { clientIdx, gameId } = socket;

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

    socket.on("voice.start", ({ }) => {
      assert(isDef(socket.gameId));
      const { clientIdx, gameId, name } = socket;

      console.log(`Player ${name} in game ${gameId} started talking.`);
      if (!speakingStatus.has(gameId)) {
        speakingStatus.set(gameId, new Map());
      }
      speakingStatus.get(gameId).set(clientIdx, true);
      // Notify other clients in the room that this player started talking (for UI)
      io.to(`game-${gameId}`).emit("voice.playerStartedTalking", {
        senderClientIdx: clientIdx,
      });
    });

    socket.on("voice.stop", ({ }) => {
      assert(isDef(socket.gameId));
      const { clientIdx, gameId } = socket;

      console.log(`Player ${name} in game ${gameId} stopped talking.`);
      if (speakingStatus.has(gameId)) {
        speakingStatus.get(gameId).set(clientIdx, false);
      }
      // Notify other clients in the room that this player stopped talking (for UI)
      io.to(`game-${gameId}`).emit("voice.playerStoppedTalking", {
        senderClientIdx: clientIdx,
      });
    });

    socket.on("voice.audioChunk", ({ chunk }) => {
      assert(isDef(socket.gameId));
      const { clientIdx, gameId } = socket;

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
      game.players.forEach((player, playerIdx) => {
        // Don't send audio back to the person who is talking.
        if (playerIdx === clientIdx) return;

        const receiverTank = game.currentState.tanks[playerIdx];
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
          player.socket.emit("voice.playerAudio", {
            senderClientIdx: clientIdx,
            chunk: chunk,
          });
        }
      });
    });
  });
}
