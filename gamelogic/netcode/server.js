"use strict";

import {
  isDef,
  serverStepSize,
  maxStepSize,
  inputCooldown,
  matchSize,
  MAX_PROXIMITY_DISTANCE,
  ErrorCode,
} from "./common.js";
import {
  initialize,
  shoot,
  removeTank,
  stopTank,
  moveVec,
  updateTimestamp
} from "../gamelogic/game-state.js";
import {
  findToken,
  updateClientInfo,
  findPlayerInfo,
} from "../../backend/token.js";
import {
  validateString,
  validateNumber
} from "../../backend/utils/validateInput.js";

import assert from "node:assert";
import bcrypt from "bcrypt";
import { matchLength } from "./common.js";

const speakingStatus = new Map();

let nextPublicGameId = 1;
let nextPrivateGameId = 0;
const games = new Map([]);

const SALT_ROUNDS = 10;

function sendError(socket, reason, err) {
  assert(err !== ErrorCode.Success);
  console.error(`Error: ${reason}`);
  socket.emit("server.error", { err });
}

function createRoom(gameId, password, playerLimit) {
  console.log(`createRoom: ${gameId}`);

  let game = games.get(gameId);
  if (isDef(game)) return ErrorCode.RoomExists;
  game = {
    inputs: [],
    players: [],
    name: `game-${gameId}`,
    started: false,
    playerLimit
  };

  if (isDef(password)) {
    const salt = bcrypt.genSaltSync(SALT_ROUNDS);
    game.password = bcrypt.hashSync(password, salt);
  }

  games.set(gameId, game);
  return ErrorCode.Success;
}

function playerJoin(socket, io, token, userId, name, gameId, password, callback) {
  let game = games.get(gameId);
  console.log(`joinRoom: ${gameId}`);

  if (!isDef(game)) return ErrorCode.InvalidRoom; 
  if (game.started) return ErrorCode.GameStarted;
  if (isDef(game.password) && !bcrypt.compareSync(password, game.password)) return ErrorCode.WrongPassword;

  // send identification back to client
  const clientIdx = game.players.length;
  callback({
    gameId,
    clientIdx,
  });

  updateClientInfo(token, {
    gameId,
    clientIdx,
  });

  game.players.push({
    socket,
    name,
    userId,
  });

  socket.join(`${game.name}`);
  console.log(`${name} joined ${game.name}`);

  if (game.players.length === game.playerLimit) {
    console.log(`Starting ${game.name}`);
    game.started = true;

    game.currentState = initialize(game.playerLimit);
    game.currentState.timestamp = Date.now();
    game.ends = Date.now() + matchLength;

    io.to(`${game.name}`).emit("match.join", {
      initialState: structuredClone(game.currentState),
      players: game.players.map((p) => p.name),
      ends: game.ends,
    });
  }

  return ErrorCode.Success;
}

function authenticateUser(socket, token, endpoint, next) {
  if (!validateString(token)) return sendError(socket, "invalid token", ErrorCode.InvalidToken);

  const playerInfo = findPlayerInfo(token);
  if (!isDef(playerInfo)) return sendError(socket, "token not mapped to player", ErrorCode.InvalidToken);

  const { clientIdx, gameId, userId, name } = playerInfo;
  socket.clientIdx = clientIdx;
  socket.gameId = gameId;
  socket.token = token;
  socket.userId = userId;
  socket.name = name;

  socket.game = games.get(socket.gameId);
  assert(!isDef(socket.game) || socket.game.players[socket.clientIdx].userId === socket.userId);

  // list of all endpoints where the user must be in a game to access them
  const inGameWhitelist = [
    "game.shoot",
    "game.moveVec",
    "game.stop",
    "game.syncReq",
    "voice.start",
    "voice.stop",
    "voice.audioChunk",
  ];

  // list of all endpoints where the user must not be in a game to access them
  const notInGameWhitelist = [
    "match.joinRequest",
    "match.createRoom",
  ];

  // general white list
  const whitelist = [
    "disconnect",
  ];

  // should always be defined
  assert(socket.name);

  let err = ErrorCode.Success;
  if (!whitelist.includes(endpoint)) {
    if (inGameWhitelist.includes(endpoint) && !(isDef(socket.game) && socket.game.started))
      err = isDef(socket.game) ? ErrorCode.GameNotStarted : ErrorCode.NotInGame;
    else if (endpoint === "match.leave" && !isDef(socket.game))
      err = ErrorCode.NotInGame;
    else if (notInGameWhitelist.includes(endpoint) && isDef(socket.game))
      err = ErrorCode.SimJoin;
  }

  if ((err === ErrorCode.Success)) {
    next();
  } else sendError(socket, `unauthorized access from ${socket.name}`, err);
}

export function bindWSHandlers(io) {
  io.on("connection", (socket) => {
    socket.use((req, next) => {
      authenticateUser(socket, req[1].token, req[0], next);
    });

    socket.on("disconnect", () =>
      console.error("Warning: Unhandled player leave!")
    );

    socket.on("match.joinRequest", ({ gameId, password }, callback) => {
      if (!validateNumber(gameId)) return sendError(socket, "Invalid gameId", ErrorCode.InvalidArgs);
      if (!validateString(password)) return sendError(socket, "Incorrect password", ErrorCode.InvalidArgs);

      const { token, userId, name } = socket;

      const joinPublic = !isDef(gameId);
      gameId = joinPublic ? nextPublicGameId : gameId;
      let game = games.get(gameId);

      if (joinPublic && (!isDef(game) || game.started)) {
        if (isDef(game)) {
          assert(game.started);
          gameId = nextPublicGameId;
          nextPublicGameId += 2;
        }

        assert(
          createRoom(gameId, undefined, matchSize, true) === ErrorCode.Success
        );
      }

      const err = playerJoin(
        socket,
        io,
        token,
        userId,
        name,
        gameId,
        password,
        callback
      );
      assert(!joinPublic || err === ErrorCode.Success);

      if (err !== ErrorCode.Success)
        sendError(socket, "unable to join room", err);
    });

    socket.on("match.createRoom", ({ password, playerLimit }, callback) => {
      if (!validateNumber(playerLimit)) return sendError(socket, "Invalid player limit", ErrorCode.InvalidArgs);
      if (!validateString(password)) return sendError(socket, "Incorrect password", ErrorCode.InvalidArgs);
      const { token, userId, name } = socket;

      let err;
      let gameId = nextPrivateGameId;
      nextPrivateGameId += 2;

      err = createRoom(
        gameId,
        password,
        playerLimit > 0 && isDef(playerLimit) ? playerLimit : matchSize
      );

      if (err === ErrorCode.Success)
        err = playerJoin(
          socket,
          io,
          token,
          userId,
          name,
          gameId,
          password,
          callback
        );

      if (err !== ErrorCode.Success)
        sendError(socket, "unable to create room", err);
    });

    socket.on("match.leave", () => {
      const { clientIdx, gameId, token, name, game } = socket;
      const ci = updateClientInfo(token, {});
      assert(ci.gameId === undefined); // ensure that token is able to be culled if it expires

      console.log(`${name} left ${game.name}`);
      socket.leave(game.name);

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
        console.log(`Deleting ${game.name}`);
        return;
      } else {
        game.players.splice(clientIdx, 1);
      }

      if (game.started) {
        removeTank(game.currentState, clientIdx);
        io.to(game.name).emit("match.playerChange", { clientIdx });
      }
    });

    socket.on("game.shoot", ({ x, y }) => {
      if (!validateNumber(x) || !validateNumber(y)) return sendError(socket, "game.shoot: invalid args", ErrorCode.InvalidArgs);;
      const { clientIdx, gameId, game } = socket;

      // if clientIdx is out of bounds return
      if (0 > clientIdx || clientIdx >= game.players.length) return;

      const now = Date.now();
      assert(isDef(clientIdx) && isDef(gameId));
      updateTimestamp(game.currentState, now, false);
      shoot(game.currentState, clientIdx, x, y);

      io.to(`${game.name}`).emit("match.stateUpdate", {
        newState: structuredClone(game.currentState),
        clientIdx,
      });
    });

    socket.on("game.moveVec", ({ dx, dy }) => {
      if (!validateNumber(dx) || !validateNumber(dy)) return sendError(socket, "game.moveVec: invalid args", ErrorCode.InvalidArgs);;
      const { clientIdx, gameId, game } = socket;

      // if clientIdx is out of bounds return
      if (0 > clientIdx || clientIdx >= game.players.length) return;
      else if (
        game.currentState.tanks[clientIdx].dSprite.dx === dx &&
        game.currentState.tanks[clientIdx].dSprite.dy === dy
      )
        return;

      const now = Date.now();

      assert(isDef(clientIdx) && isDef(gameId));
      updateTimestamp(game.currentState, now, false);
      moveVec(game.currentState, clientIdx, dx, dy);

      io.to(`${game.name}`).emit("match.stateUpdate", {
        newState: structuredClone(game.currentState),
        clientIdx,
      });

      console.log("move req");
    });

    socket.on("game.stop", ({}) => {
      const { clientIdx, gameId, game } = socket;

      // if clientIdx is out of bounds return
      if (0 > clientIdx || clientIdx >= game.players.length) return;
      else if (
        game.currentState.tanks[clientIdx].dSprite.dx === 0 &&
        game.currentState.tanks[clientIdx].dSprite.dy === 0
      )
        return;

      const now = Date.now();

      assert(isDef(clientIdx) && isDef(gameId));
      updateTimestamp(game.currentState, now, false);
      stopTank(game.currentState, clientIdx);

      io.to(`${game.name}`).emit("match.stateUpdate", {
        newState: structuredClone(game.currentState),
        clientIdx,
      });

      console.log("stop req");
    });

    socket.on("game.syncReq", ({}) => {
      updateTimestamp(socket.game.currentState, Date.now(), false);
      socket.emit("match.stateUpdate", {
        newState: socket.game.currentState,
      });
    });

    socket.on("voice.start", ({}) => {
      const { clientIdx, gameId, name, game } = socket;

      console.log(`Player ${name} in game ${gameId} started talking.`);
      if (!speakingStatus.has(gameId)) {
        speakingStatus.set(gameId, new Map());
      }
      speakingStatus.get(gameId).set(clientIdx, true);
      // Notify other clients in the room that this player started talking (for UI)
      io.to(`${game.name}`).emit("voice.playerStartedTalking", {
        senderClientIdx: clientIdx,
      });
    });

    socket.on("voice.stop", ({}) => {
      const { clientIdx, gameId, name, game } = socket;

      console.log(`Player ${name} in game ${gameId} stopped talking.`);
      if (speakingStatus.has(gameId)) {
        speakingStatus.get(gameId).set(clientIdx, false);
      }
      // Notify other clients in the room that this player stopped talking (for UI)
      io.to(`${game.name}`).emit("voice.playerStoppedTalking", {
        senderClientIdx: clientIdx,
      });
    });

    socket.on("voice.audioChunk", ({ chunk }) => {
      const { clientIdx, gameId, game } = socket;

      if (
        !speakingStatus.has(gameId) ||
        !speakingStatus.get(gameId).get(clientIdx)
      ) {
        // console.warn(`Received audio chunk from non-speaking player ${clientIdx} in game ${gameId}.`);
        return;
      }

      const senderTank = game.currentState.tanks[clientIdx]
        ? game.currentState.tanks[clientIdx].dSprite
        : undefined;
      if (!senderTank) {
        console.warn(
          `Sender tank ${clientIdx} not found for audio chunk in game ${gameId}.`
        );
        return;
      }

      // Iterate through all players in the game to determine proximity
      game.players.forEach((player, receiverIdx) => {
        // Don't send audio back to the person who is talking.
        if (receiverIdx === clientIdx) return;

        const receiverTank = game.currentState.tanks[receiverIdx].dSprite;
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

  setInterval(() => {
    games.forEach((game, gameId) => {
      const now = Date.now();

      // assert each is game is started or is not full
      assert(game.started || game.players.length < game.playerLimit);

      // assert each player is mapped to the correct clientIdx and are in the correct room
      game.players.forEach((player, clientIdx) => {
        const playerToken = findToken(player.userId);
        const playerInfo = findPlayerInfo(playerToken.token);

        assert(playerToken.name === playerInfo.name);
        assert(playerInfo.userId === player.userId);
        assert(playerInfo.clientIdx === clientIdx);
        assert(playerInfo.gameId === gameId);
      })

      // check if game has ended
      if (isDef(game.ends) && game.ends < now) {
        assert(game.started);
        updateTimestamp(game.currentState, now, false);
        game.started = false;

        io.to(game.name).emit("match.end", {
          finalState: structuredClone(game.currentState),
        });

        game.players.forEach((player) => {
          player.socket.leave();
          const tokenInfo = findToken(player.userId);
          updateClientInfo(tokenInfo.token, {});
          console.log(`${player.name} has left ${game.name}`);
        })

        console.log(`${game.name} has ended`);
        games.delete(gameId);
      }
    });
  }, 1000);
}