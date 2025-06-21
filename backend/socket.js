let nextMatchId = 0;

const rooms = {};

export function bindWSHandlers(io) {
  io.on("connection", (socket) => {
    console.log("user connected ...");

    socket.on("disconnect", () => {
      console.log("user disconnected ...");
    })

    socket.on("match.joinRequest", ({ user }) => {
      console.log(`user joined room-${nextMatchId}`);
      socket.join(`room-${nextMatchId}`);
      if (!rooms[`room-${nextMatchId}`]) {
        rooms[`room-${nextMatchId}`] = {
          players: [],
        };
      }

      const room = rooms[`room-${nextMatchId}`];
      room.players.push(user);

      if (room.players.length === 4) {
        socket.to(`room-${nextMatchId}`).emit("match.join", {
          matchId: nextMatchId++
        });

        console.log("req sent");
      }
    })
  })
}