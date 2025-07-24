import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import http from "http";

import { paymentsRouter } from "./routers/payments_router.js";
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
  origin: process.env.CORS_ORIGIN || "http://localhost:4200",
  credentials: true,
};

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions,
});

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/users", usersRouter);
app.use("/api/payments", paymentsRouter);

//bindWSHandlers(io);

httpServer.listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
});
