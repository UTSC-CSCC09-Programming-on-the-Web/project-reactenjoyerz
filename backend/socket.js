let waitingPlayer = null;

export function bindWSHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      io.emit("peer.disconnected", { fromId: socket.id });

      if (waitingPlayer && waitingPlayer.id === socket.id) {
        waitingPlayer = null;
      }
    });

    socket.on("match.joinRequest", () => {
      console.log(`User ${socket.id} is looking for a match.`);

      if (waitingPlayer) {
        const player1 = waitingPlayer;
        const player2 = socket;

        const matchId = `match-${player1.id}-${player2.id}`;

        player1.join(matchId);
        player2.join(matchId);

        waitingPlayer = null;

        console.log(`Match found! Starting match in room ${matchId}`);

        io.to(matchId).emit("match.found", {
          matchId: matchId,
          peerIds: [player1.id, player2.id],
        });
      } else {
        waitingPlayer = socket;
        console.log(`User ${socket.id} is now waiting.`);
      }
    });

    socket.on("webrtc.offer", ({ targetId, offer }) => {
      io.to(targetId).emit("webrtc.offer", {
        fromId: socket.id,
        offer,
      });
    });

    socket.on("webrtc.answer", ({ targetId, answer }) => {
      io.to(targetId).emit("webrtc.answer", {
        fromId: socket.id,
        answer,
      });
    });

    socket.on("webrtc.ice-candidate", ({ targetId, candidate }) => {
      io.to(targetId).emit("webrtc.ice-candidate", {
        fromId: socket.id,
        candidate,
      });
    });
  });
}
