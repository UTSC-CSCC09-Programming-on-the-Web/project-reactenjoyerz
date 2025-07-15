import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import session from "express-session";
import { Server } from "socket.io";

import { paymentsRouter } from "./routers/payments_router.js";
import { usersRouter } from "./routers/users_router.js";
import { webhookRouter } from "./routers/webhook.js";
import { bindWSHandlers } from "./socket.js";

dotenv.config();

const PORT = 8000;
const app = express();

const sessionMiddleware = session({
  secret: process.env.SECRET_KEY || "test",
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: "lax",
  },
});

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:4200",
    credentials: true,
  },
});

app.use(
  cors({
    origin: "http://localhost:4200",
    credentials: true,
  })
);

app.use("/webhook", webhookRouter);
app.use(express.json());
app.use(sessionMiddleware);

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

app.use("/api/users", usersRouter);
app.use("/api/payments", paymentsRouter);

bindWSHandlers(io);

httpServer.listen(PORT, (err) => {
  if (err) {
    console.error("Failed to start server:", err);
  } else {
    console.log("HTTP server running on http://localhost:%s", PORT);
  }
});
