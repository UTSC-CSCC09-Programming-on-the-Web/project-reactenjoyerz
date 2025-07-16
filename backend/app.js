import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { paymentsRouter } from "./routers/payments_router.js";
import http from "http";
import session from "express-session";

import { usersRouter } from "./routers/users_router.js";
import { Server } from "socket.io";
import { bindWSHandlers } from "../gamelogic/netcode/server.js";
import { webhookRouter } from "./routers/webhook.js";

dotenv.config();

const PORT = 8000;
const app = express();

app.use("/webhook", webhookRouter);

app.use(bodyParser.json());

const corsOptions = {
  origin: "http://localhost:4200",
  credentials: true,
};

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions,
});

app.use(cors(corsOptions));
app.use(express.json());

const sessionMiddleware = session({
  secret: process.env.SECRET_KEY || "test",
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: true,
  },
});

app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);

app.use("/api/users", usersRouter);
app.use("/api/payments", paymentsRouter);

bindWSHandlers(io);

httpServer.listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
});
