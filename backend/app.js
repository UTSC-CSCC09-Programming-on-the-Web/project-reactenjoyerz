import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from "body-parser";
import http from "http";
import session from "express-session";

import { usersRouter } from './routers/users_router.js';
import { Server } from "socket.io";
import { bindWSHandlers } from './socket.js';

dotenv.config();

const PORT = 8000;
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { 
    origin: "*"
  }
});

app.use(bodyParser.json());

app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));
app.use(express.json());


app.use(
  session({
    secret: process.env.SECRET_KEY || "test",
    resave: false,
    saveUninitialized: true,
  }),
);

app.use("/api/users", usersRouter);

bindWSHandlers(io);

httpServer.listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
});