let nextMatchId = 0;

const rooms = {};

export function bindWSHandlers(io) {
  io.on("connection", (socket) => {
    console.log("user connected ...");

    socket.emit("voice.welcome", { id: socket.id });

    socket.on("voice.signal", ({ to, data }) => {
      io.to(to).emit("voice.signal", {
        from: socket.id,
        data,
      });
    });

    socket.on("disconnect", () => {
      console.log("user disconnected ...");
      io.emit("peer.disconnected", { fromId: socket.id });
    });

    socket.on("match.joinRequest", ({ user }) => {
      console.log(`user joined room-${nextMatchId}`);
      socket.join(`room-${nextMatchId}`);
      if (!rooms[`room-${nextMatchId}`]) {
        rooms[`room-${nextMatchId}`] = {
          players: [],
          sockets: [],
        };
      }

      const room = rooms[`room-${nextMatchId}`];
      room.players.push(user);
      room.sockets.push(socket.id);

      if (room.players.length === 4) {
        socket.to(`room-${nextMatchId}`).emit("match.join", {
          matchId: nextMatchId++,
          players: room.players,
          socketIds: room.sockets,
        });

        console.log("req sent");
        nextMatchId++;
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
