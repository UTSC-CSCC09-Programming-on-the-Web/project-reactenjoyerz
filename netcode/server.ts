import { io } from "./app.js";

type MatchJoinRequest = {
  user: string,
}

io.on("connection", (socket) => {
  console.log("user connected ...");

  socket.on("disconnect", () => {
    console.log("user disconnected ...");
  });

  socket.on("match.joinRequest", (user: MatchJoinRequest) => {
    console.log(`${user.user} joined room-`);;
  });
});

console.log("Server initialized ...");
