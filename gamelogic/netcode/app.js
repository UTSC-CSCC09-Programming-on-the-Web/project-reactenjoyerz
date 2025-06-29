import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import http from "http";
import session from "express-session";

import { Server } from "socket.io";

dotenv.config();

const PORT = 8000;
const app = express();

app.use(bodyParser.json());

const httpServer = http.createServer(app);
export const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

app.use(
  cors({
    origin: "http://localhost:4200",
    credentials: true,
  })
);
app.use(express.json());

app.use(
  session({
    secret: process.env.SECRET_KEY || "test",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      httpOnly: true,
    },
  })
);

httpServer.listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
});
