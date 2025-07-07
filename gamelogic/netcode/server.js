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
      console.log("reload", socket.request.session);
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
      console.log("match join", socket.request.session);
    });

    socket.on("game.shoot", (input) => {

    });

    socket.on("game.move", (input) => {

    });
  });
}
